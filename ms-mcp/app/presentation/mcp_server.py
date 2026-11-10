import json
import logging
import asyncio
import uuid
from typing import Dict, Any, List, Optional, AsyncGenerator, Tuple
from fastapi import APIRouter, Request, Header, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse

from ..config import settings
from ..domain.models import ReportResult, ReportStatus, ExportFormat
from ..application.reports_service import reports_service
from ..infrastructure.auth.token_service import token_service
from ..infrastructure.auth.oauth_validator import oauth_validator
from ..infrastructure.db.storage import storage_service
from ..infrastructure.exports.csv_exporter import csv_exporter
from ..infrastructure.exports.pdf_exporter import pdf_exporter

logger = logging.getLogger("ms-mcp.mcp-server")

router = APIRouter()

# Active SSE sessions: session_id -> asyncio.Queue
sse_sessions: Dict[str, asyncio.Queue] = {}

# Tool Definitions and Schemas for MCP tools/list
MCP_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "listar_inscripciones",
        "description": "Reporte 1: Clientes inscritos en el último mes o periodo personalizado. Distingue entre nuevos socios y renovaciones.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "fecha_inicio": {"type": "string", "description": "Fecha inicio ISO (YYYY-MM-DD), inclusiva."},
                "fecha_fin": {"type": "string", "description": "Fecha fin ISO (YYYY-MM-DD), exclusiva."},
                "estado": {"type": "string", "description": "Filtro de estado: ACTIVA, VENCIDA, CANCELADA, PENDIENTE."},
                "tipo": {"type": "string", "enum": ["TODAS", "NUEVA", "RENOVACION"], "description": "Tipo de inscripción."}
            }
        },
        "scopes": ["membresias"]
    },
    {
        "name": "reporte_asistencias",
        "description": "Reportes 2 y 18: Registro de accesos y afluencia al gimnasio en un rango de fechas y franja horaria (ej. 06:00 a 09:00).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "fecha_inicio": {"type": "string", "description": "Fecha inicio ISO (YYYY-MM-DD), inclusiva."},
                "fecha_fin": {"type": "string", "description": "Fecha fin ISO (YYYY-MM-DD), exclusiva."},
                "hora_inicio": {"type": "string", "description": "Hora inicio franja (HH:MM), ej '06:00'."},
                "hora_fin": {"type": "string", "description": "Hora fin franja (HH:MM), ej '09:00'."},
                "estado_acceso": {"type": "string", "enum": ["PERMITIDO", "DENEGADO", "TODOS"], "description": "Filtro de estado de acceso."}
            }
        },
        "scopes": ["asistencia"]
    },
    {
        "name": "reporte_fallas_mantenimiento",
        "description": "Reporte 3: Máquinas actualmente averiadas y mantenimientos previstos ordenados por fecha programada.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "estado_mantenimiento": {"type": "string", "description": "Filtro de estado: PENDIENTE, EN_PROCESO, COMPLETADO."},
                "tipo_mantenimiento": {"type": "string", "description": "Filtro: PREVENTIVO, CORRECTIVO, URGENTE."},
                "solo_averiados": {"type": "boolean", "description": "Filtrar únicamente equipos con avería activa."}
            }
        },
        "scopes": ["inventario"]
    },
    {
        "name": "listar_socios_inactivos",
        "description": "Reporte 4: Socios con membresía activa que no registran accesos en los últimos N días (por defecto 14 días) para campañas de retención.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "dias_inactividad": {"type": "integer", "default": 14, "description": "Días mínimos sin registrar ingreso (default 14)."},
                "solo_activos": {"type": "boolean", "default": True, "description": "Verificar solo membresías actualmente activas."}
            }
        },
        "scopes": ["asistencia", "membresias"]
    },
    {
        "name": "reporte_membresias_por_vencer",
        "description": "Reporte 5: Socios cuya membresía expira en los próximos N días (por defecto 7 días).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "dias_anticipacion": {"type": "integer", "default": 7, "description": "Días hacia adelante a evaluar (default 7)."}
            }
        },
        "scopes": ["membresias"]
    },
    {
        "name": "reporte_recaudacion",
        "description": "Reporte 6: Recaudación total acumulada de una fecha dada (default hoy), desglosada por membresías y mostrador.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "fecha": {"type": "string", "description": "Fecha a auditar (YYYY-MM-DD). Default hoy."},
                "incluir_mostrador": {"type": "boolean", "default": True, "description": "Indica si se audita mostrador (retorna advertencia si no existe)."}
            }
        },
        "scopes": ["finanzas"]
    },
    {
        "name": "reporte_morosidad",
        "description": "Reportes 7 y 15: Deuda global acumulada y socios con cuotas impagas vencidas con más de N días de retraso (default 15 días).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "dias_retraso_minimo": {"type": "integer", "default": 15, "description": "Días mínimos de retraso desde fecha vencimiento."}
            }
        },
        "scopes": ["finanzas"]
    },
    {
        "name": "reporte_afluencia",
        "description": "Reportes 8 y 17: Análisis de afluencia por horas pico de la semana o día del mes con menor asistencia.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "tipo_analisis": {"type": "string", "enum": ["HORAS_PICO", "MENOR_ASISTENCIA"], "default": "HORAS_PICO", "description": "Tipo de análisis estadístico."},
                "dias_atras": {"type": "integer", "default": 30, "description": "Ventana de observación en días hacia atrás."}
            }
        },
        "scopes": ["asistencia"]
    },
    {
        "name": "reporte_ocupacion_clases",
        "description": "Reporte 9: Clases grupales que alcanzaron el 100% de ocupación en base a las disciplinas y capacidad del catálogo.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "umbral_porcentaje": {"type": "number", "default": 100.0, "description": "Porcentaje mínimo de ocupación (default 100)."}
            }
        },
        "scopes": ["asistencia"]
    },
    {
        "name": "ranking_instructores",
        "description": "Reporte 10: Instructor con mayor cantidad de alumnos activos inscritos en sus disciplinas en el mes evaluado.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "mes": {"type": "integer", "description": "Mes numérico (1-12). Default último mes cerrado."},
                "anio": {"type": "integer", "description": "Año numérico. Default actual."},
                "top": {"type": "integer", "default": 10, "description": "Cantidad de posiciones a retornar."}
            }
        },
        "scopes": ["identidades", "asistencia"]
    },
    {
        "name": "ranking_productos_vendidos",
        "description": "Reporte 11: Suplementos y bebidas más vendidos del mes en tienda / cafetería.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "mes": {"type": "integer", "description": "Mes numérico (1-12)."},
                "anio": {"type": "integer", "description": "Año numérico."},
                "top": {"type": "integer", "default": 10, "description": "Cantidad de ítems."}
            }
        },
        "scopes": ["inventario"]
    },
    {
        "name": "listar_productos_stock_bajo",
        "description": "Reporte 12: Productos del inventario de cafetería / suplementos por debajo del stock mínimo.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "umbral_minimo": {"type": "integer", "default": 5, "description": "Umbral mínimo de unidades."}
            }
        },
        "scopes": ["inventario"]
    },
    {
        "name": "ranking_rachas_asistencia",
        "description": "Reporte 13: Top de socios con mayor racha de días consecutivos asistiendo al gimnasio.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "top": {"type": "integer", "default": 10, "description": "Número de socios a incluir en el ranking."},
                "dias_evaluados": {"type": "integer", "default": 60, "description": "Ventana de observación en días."}
            }
        },
        "scopes": ["asistencia"]
    },
    {
        "name": "reporte_bajas_no_renovaciones",
        "description": "Reporte 14: Clientes nuevos del mes N que no renovaron su plan tras vencer su primer contrato.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "mes": {"type": "integer", "description": "Mes numérico de inicio evaluado."},
                "anio": {"type": "integer", "description": "Año numérico de inicio evaluado."}
            }
        },
        "scopes": ["membresias"]
    },
    {
        "name": "reporte_cumplimiento_rutinas",
        "description": "Reporte 16: Socios con rutinas activas y seguimiento del plan de entrenamiento.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "top": {"type": "integer", "default": 20, "description": "Cantidad de socios a evaluar."}
            }
        },
        "scopes": ["entrenamiento"]
    },
    {
        "name": "ranking_fallas_equipos",
        "description": "Reporte 19: Máquinas de cardio o musculación con mayor cantidad de averías o fallas registradas en el año.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "anio": {"type": "integer", "description": "Año a consultar. Default actual."},
                "categoria": {"type": "string", "default": "CARDIO", "description": "Filtro categoría: CARDIO, FUERZA, etc."},
                "top": {"type": "integer", "default": 10, "description": "Cantidad de máquinas en el ranking."}
            }
        },
        "scopes": ["inventario"]
    },
    {
        "name": "comparar_ingresos",
        "description": "Reporte 20: Comparación financiera entre ingresos del mes actual versus el mes inmediato anterior.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "mes_actual": {"type": "integer", "description": "Mes actual a comparar (1-12)."},
                "anio_actual": {"type": "integer", "description": "Año a comparar."}
            }
        },
        "scopes": ["finanzas"]
    },
    {
        "name": "obtener_capacidades_reportes",
        "description": "Meta-herramienta: Consulta el catálogo completo de 17 herramientas MCP y cobertura de las 20 preguntas analíticas del gimnasio.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        },
        "scopes": []
    },
    {
        "name": "exportar_reporte",
        "description": "Genera y descarga un reporte en formato CSV (con sanitización OWASP contra inyección de fórmulas) o PDF corporativo con diseño ApexFitness.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "herramienta": {"type": "string", "description": "Nombre de la herramienta MCP a ejecutar y exportar."},
                "parametros": {"type": "object", "default": {}, "description": "Parámetros que se pasarán a la herramienta."},
                "formato": {"type": "string", "enum": ["CSV", "PDF"], "description": "Formato de exportación deseado."}
            },
            "required": ["herramienta", "formato"]
        },
        "scopes": ["exportaciones"]
    }
]

TOOL_MAP = {t["name"]: t for t in MCP_TOOLS}

async def authenticate_caller(auth_header: Optional[str]) -> Tuple[Dict[str, Any], str]:
    """
    Verifica Bearer token o JWT.
    Retorna (token_data, raw_token).
    """
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Header de autorización 'Bearer <token>' ausente o inválido")

    raw_token = auth_header.split(" ", 1)[1].strip()

    # Primero verificar token estático/hasheado en SQLite
    is_valid, _, token_record = token_service.validate_token(raw_token)
    if is_valid and token_record:
        return {
            "token_id": token_record.get("token_id"),
            "owner": token_record.get("owner"),
            "scopes": token_record.get("scopes", []),
            "type": "api_token"
        }, raw_token

    # Segundo verificar si es un JWT OIDC de ms-auth
    if raw_token.count(".") == 2:
        jwt_claims = await oauth_validator.validate_jwt(raw_token)
        if jwt_claims:
            return {
                "token_id": jwt_claims.get("sub", "jwt-sub"),
                "owner": jwt_claims.get("email") or jwt_claims.get("username", "jwt-user"),
                "scopes": ["*"],  # JWT administrativo de sesión tiene acceso total
                "type": "jwt_oidc"
            }, raw_token

    raise HTTPException(status_code=401, detail="Token no válido, expirado o revocado")

def check_permission(caller_scopes: List[str], required_scopes: List[str]):
    if "*" in caller_scopes:
        return
    for req in required_scopes:
        if req not in caller_scopes:
            raise HTTPException(
                status_code=403,
                detail=f"Permiso denegado: Se requiere el scope '{req}' para ejecutar esta herramienta"
            )

async def dispatch_tool(tool_name: str, arguments: Dict[str, Any]) -> ReportResult:
    """Invoca la función correspondiente en ReportsService."""
    if tool_name == "listar_inscripciones":
        return await reports_service.listar_inscripciones(**arguments)
    elif tool_name == "reporte_asistencias":
        return await reports_service.reporte_asistencias(**arguments)
    elif tool_name == "reporte_fallas_mantenimiento":
        return await reports_service.reporte_fallas_mantenimiento(**arguments)
    elif tool_name == "listar_socios_inactivos":
        return await reports_service.listar_socios_inactivos(**arguments)
    elif tool_name == "reporte_membresias_por_vencer":
        return await reports_service.reporte_membresias_por_vencer(**arguments)
    elif tool_name == "reporte_recaudacion":
        return await reports_service.reporte_recaudacion(**arguments)
    elif tool_name == "reporte_morosidad":
        return await reports_service.reporte_morosidad(**arguments)
    elif tool_name == "reporte_afluencia":
        return await reports_service.reporte_afluencia(**arguments)
    elif tool_name == "reporte_ocupacion_clases":
        return await reports_service.reporte_ocupacion_clases(**arguments)
    elif tool_name == "ranking_instructores":
        return await reports_service.ranking_instructores(**arguments)
    elif tool_name == "ranking_productos_vendidos":
        return await reports_service.ranking_productos_vendidos(**arguments)
    elif tool_name == "listar_productos_stock_bajo":
        return await reports_service.listar_productos_stock_bajo(**arguments)
    elif tool_name == "ranking_rachas_asistencia":
        return await reports_service.ranking_rachas_asistencia(**arguments)
    elif tool_name == "reporte_bajas_no_renovaciones":
        return await reports_service.reporte_bajas_no_renovaciones(**arguments)
    elif tool_name == "reporte_cumplimiento_rutinas":
        return await reports_service.reporte_cumplimiento_rutinas(**arguments)
    elif tool_name == "ranking_fallas_equipos":
        return await reports_service.ranking_fallas_equipos(**arguments)
    elif tool_name == "comparar_ingresos":
        return await reports_service.comparar_ingresos(**arguments)
    else:
        raise ValueError(f"Herramienta no implementada: {tool_name}")

async def handle_export_tool(arguments: Dict[str, Any]) -> ReportResult:
    """Manejo de la herramienta exportar_reporte."""
    target_tool = arguments.get("herramienta")
    target_params = arguments.get("parametros", {})
    formato_str = str(arguments.get("formato", "CSV")).upper()

    if target_tool not in TOOL_MAP or target_tool == "exportar_reporte":
        raise ValueError(f"Herramienta a exportar inválida: {target_tool}")

    result = await dispatch_tool(target_tool, target_params)

    if formato_str == "PDF":
        file_rec = pdf_exporter.export_to_pdf(result)
    else:
        file_rec = csv_exporter.export_to_csv(result)

    storage_service.save_export_file(file_rec)

    download_url = f"/api/reportes/descargas/{file_rec.file_id}"
    return ReportResult(
        herramienta="exportar_reporte",
        titulo=f"Exportación de Reporte ({file_rec.formato.value})",
        periodo_interpretado=result.periodo_interpretado,
        fecha_corte=result.fecha_corte,
        fuentes_consultadas=result.fuentes_consultadas,
        cobertura=result.cobertura,
        totales={
            "file_id": file_rec.file_id,
            "filename": file_rec.filename,
            "formato": file_rec.formato.value,
            "tamanio_bytes": file_rec.tamanio_bytes,
            "url_descarga": download_url,
            "filas_exportadas": result.total_filas
        },
        filas=[{
            "archivo": file_rec.filename,
            "url": download_url,
            "formato": file_rec.formato.value,
            "expira": file_rec.expires_at
        }],
        total_filas=1,
        definicion=f"Archivo binario generado a partir de la ejecución de {target_tool}.",
        advertencias=result.advertencias,
        estado=result.estado,
        metadatos={"file_record": file_rec.model_dump()}
    )

async def process_json_rpc(message: Dict[str, Any], caller: Dict[str, Any], raw_token: str) -> Dict[str, Any]:
    """Procesa una petición JSON-RPC 2.0 individual del protocolo MCP."""
    req_id = message.get("id")
    method = message.get("method")
    params = message.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {"listChanged": False}
                },
                "serverInfo": {
                    "name": "apexfitness-reports-mcp",
                    "version": "1.0.0"
                },
                "instructions": (
                    "Servidor de Reportes e Inteligencia Analítica de ApexFitness. "
                    "Provee 17 herramientas analíticas auditadas, con cálculo de periodos según America/La_Paz, "
                    "sin invención de datos y con trazabilidad completa."
                )
            }
        }

    elif method == "notifications/initialized":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    elif method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    elif method == "tools/list":
        # Filtrar herramientas accesibles por los scopes del invocador
        caller_scopes = caller.get("scopes", [])
        accessible_tools = []
        for t in MCP_TOOLS:
            req_scopes = t.get("scopes", [])
            if "*" in caller_scopes or not req_scopes or any(s in caller_scopes for s in req_scopes):
                accessible_tools.append({
                    "name": t["name"],
                    "description": t["description"],
                    "inputSchema": t["inputSchema"]
                })
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": accessible_tools
            }
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})

        if tool_name not in TOOL_MAP:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32601,
                    "message": f"Herramienta desconocida: {tool_name}"
                }
            }

        tool_meta = TOOL_MAP[tool_name]
        try:
            check_permission(caller.get("scopes", []), tool_meta.get("scopes", []))
        except HTTPException as exc:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32000,
                    "message": exc.detail
                }
            }

        # Ejecución
        status_code = 200
        err_msg = None
        try:
            if tool_name == "obtener_capacidades_reportes":
                caps = reports_service.obtener_capacidades_reportes()
                result_text = json.dumps(caps, ensure_ascii=False, indent=2)
            elif tool_name == "exportar_reporte":
                rep_res = await handle_export_tool(tool_args)
                result_text = json.dumps(rep_res.model_dump(), ensure_ascii=False, indent=2)
            else:
                rep_res = await dispatch_tool(tool_name, tool_args)
                result_text = json.dumps(rep_res.model_dump(), ensure_ascii=False, indent=2)

            response_data = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": result_text
                        }
                    ]
                }
            }
        except Exception as exc:
            logger.error(f"Error ejecutando herramienta {tool_name}: {exc}", exc_info=True)
            status_code = 500
            err_msg = str(exc)
            response_data = {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32603,
                    "message": f"Fallo interno en ejecución de reporte: {str(exc)}"
                }
            }

        # Auditoría en base de datos
        storage_service.log_simple_audit(
            tool_name=tool_name,
            caller=caller.get("owner", "desconocido"),
            token_prefix=raw_token[:8] if raw_token else "none",
            params=tool_args,
            status_code=status_code,
            error_message=err_msg
        )

        return response_data

    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32601,
                "message": f"Método no soportado: {method}"
            }
        }


# =============================================================================
# ENDPOINT MCP STREAMABLE HTTP (POST /mcp)
# Compatible con Cursor, Claude Desktop, ChatGPT y agentes autónomos
# =============================================================================
@router.post("/mcp")
async def mcp_streamable_post(request: Request, authorization: Optional[str] = Header(None)):
    caller, raw_token = await authenticate_caller(authorization)
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Cuerpo de petición no es JSON válido")

    if isinstance(payload, list):
        # Batch JSON-RPC
        results = [await process_json_rpc(msg, caller, raw_token) for msg in payload]
        return JSONResponse(content=results)
    else:
        result = await process_json_rpc(payload, caller, raw_token)
        return JSONResponse(content=result)


# =============================================================================
# ENDPOINTS MCP SERVER-SENT EVENTS (SSE) (GET /sse y POST /messages)
# Compatible con clientes MCP legacy o streaming continuo
# =============================================================================
@router.get("/sse")
async def sse_handshake(request: Request, authorization: Optional[str] = Header(None)):
    caller, raw_token = await authenticate_caller(authorization)
    session_id = str(uuid.uuid4())
    queue: asyncio.Queue = asyncio.Queue()
    sse_sessions[session_id] = queue

    async def event_generator() -> AsyncGenerator[str, None]:
        # Enviar evento de endpoint inicial según especificación MCP
        yield f"event: endpoint\ndata: /messages?sessionId={session_id}\n\n"
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"event: message\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
                except asyncio.TimeoutError:
                    # Enviar ping keep-alive
                    yield ": ping\n\n"
        finally:
            sse_sessions.pop(session_id, None)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/messages")
async def sse_messages(
    request: Request,
    sessionId: str = Query(...),
    authorization: Optional[str] = Header(None)
):
    caller, raw_token = await authenticate_caller(authorization)
    if sessionId not in sse_sessions:
        raise HTTPException(status_code=404, detail="Sesión SSE no encontrada o desconectada")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Cuerpo de petición no es JSON válido")

    result = await process_json_rpc(payload, caller, raw_token)
    await sse_sessions[sessionId].put(result)
    return JSONResponse(content={"status": "accepted"})
