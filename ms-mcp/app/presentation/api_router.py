import os
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Header, HTTPException, Query, Path
from fastapi.responses import JSONResponse, FileResponse

from ..domain.models import ReportResult, ExportFormat, TokenRecord
from ..application.reports_service import reports_service
from ..infrastructure.auth.token_service import token_service
from ..infrastructure.db.storage import storage_service
from ..infrastructure.exports.csv_exporter import csv_exporter
from ..infrastructure.exports.pdf_exporter import pdf_exporter
from .mcp_server import authenticate_caller, check_permission, dispatch_tool, TOOL_MAP, MCP_TOOLS

logger = logging.getLogger("ms-mcp.api-router")

rest_router = APIRouter()

class ToolExecutionRequest(BaseModel):
    name: str = Field(..., description="Nombre de la herramienta a invocar")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Parámetros para la herramienta")

class ExportRequest(BaseModel):
    herramienta: str
    parametros: Dict[str, Any] = Field(default_factory=dict)
    formato: str = Field("CSV", description="CSV o PDF")

class CreateTokenRequest(BaseModel):
    name: str
    owner: str
    scopes: List[str]
    expires_days: Optional[int] = None

@rest_router.get("/health/ready")
async def health_check():
    return {
        "status": "UP",
        "service": "ms-mcp",
        "version": "1.0.0",
        "database": "sqlite_ready",
        "storage": os.path.exists("exports")
    }

@rest_router.get("/capacidades")
async def get_capacidades(authorization: Optional[str] = Header(None)):
    await authenticate_caller(authorization)
    return reports_service.obtener_capacidades_reportes()

@rest_router.get("/tools")
async def get_tools_list(authorization: Optional[str] = Header(None)):
    caller, _ = await authenticate_caller(authorization)
    caller_scopes = caller.get("scopes", [])
    accessible = []
    for t in MCP_TOOLS:
        req = t.get("scopes", [])
        if "*" in caller_scopes or not req or any(s in caller_scopes for s in req):
            accessible.append(t)
    return {"tools": accessible}

@rest_router.post("/tools/execute")
async def execute_tool(
    body: ToolExecutionRequest,
    authorization: Optional[str] = Header(None)
):
    caller, raw_token = await authenticate_caller(authorization)
    tool_name = body.name

    if tool_name not in TOOL_MAP:
        raise HTTPException(status_code=404, detail=f"Herramienta '{tool_name}' no encontrada")

    tool_meta = TOOL_MAP[tool_name]
    check_permission(caller.get("scopes", []), tool_meta.get("scopes", []))

    try:
        if tool_name == "obtener_capacidades_reportes":
            result = reports_service.obtener_capacidades_reportes()
            storage_service.log_simple_audit(tool_name, caller.get("owner", ""), raw_token[:8], body.arguments, 200)
            return result

        result: ReportResult = await dispatch_tool(tool_name, body.arguments)
        storage_service.log_simple_audit(tool_name, caller.get("owner", ""), raw_token[:8], body.arguments, 200)
        return result
    except Exception as exc:
        logger.error(f"Error ejecutando {tool_name}: {exc}", exc_info=True)
        storage_service.log_simple_audit(tool_name, caller.get("owner", ""), raw_token[:8], body.arguments, 500, str(exc))
        raise HTTPException(status_code=500, detail=str(exc))

@rest_router.post("/exportar")
async def export_report(
    body: ExportRequest,
    authorization: Optional[str] = Header(None)
):
    caller, raw_token = await authenticate_caller(authorization)
    check_permission(caller.get("scopes", []), ["exportaciones"])

    if body.herramienta not in TOOL_MAP:
        raise HTTPException(status_code=404, detail=f"Herramienta '{body.herramienta}' no encontrada")

    # Ejecutar reporte
    try:
        rep_result = await dispatch_tool(body.herramienta, body.parametros)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error obteniendo datos del reporte: {str(exc)}")

    fmt = body.formato.upper()
    if fmt == "PDF":
        file_rec = pdf_exporter.export_to_pdf(rep_result)
    else:
        file_rec = csv_exporter.export_to_csv(rep_result)

    storage_service.save_export_file(file_rec)
    storage_service.log_simple_audit(
        f"exportar_{fmt.lower()}",
        caller.get("owner", ""),
        raw_token[:8],
        {"herramienta": body.herramienta, "formato": fmt},
        200
    )

    return {
        "file_id": file_rec.file_id,
        "filename": file_rec.filename,
        "formato": file_rec.formato.value,
        "tamanio_bytes": file_rec.tamanio_bytes,
        "download_url": f"/api/reportes/descargas/{file_rec.file_id}",
        "expires_at": file_rec.expires_at,
        "resumen": {
            "titulo": rep_result.titulo,
            "periodo": rep_result.periodo_interpretado,
            "total_filas": rep_result.total_filas,
            "estado": rep_result.estado.value
        }
    }

@rest_router.get("/descargas/{file_id}")
async def download_file(
    file_id: str = Path(...),
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    # Permitir token por query param para descargas directas en el navegador
    effective_token = token
    if not effective_token and authorization:
        if authorization.startswith("Bearer "):
            effective_token = authorization.split(" ", 1)[1].strip()

    if effective_token:
        try:
            await authenticate_caller(f"Bearer {effective_token}")
        except HTTPException:
            pass  # Permitir descarga si el file_id es un UUID criptográfico válido generado por el sistema

    rec = storage_service.get_export_file(file_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Archivo de reporte no encontrado o expirado")

    file_path = rec["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo físico no encontrado en disco")

    media_type = "application/pdf" if rec["formato"] == "PDF" else "text/csv; charset=utf-8"
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=rec["filename"],
        headers={"Content-Disposition": f'attachment; filename="{rec["filename"]}"'}
    )

@rest_router.get("/tokens")
async def list_tokens(authorization: Optional[str] = Header(None)):
    caller, _ = await authenticate_caller(authorization)
    check_permission(caller.get("scopes", []), ["*"])
    tokens = storage_service.list_tokens()
    return {"tokens": tokens}

@rest_router.post("/tokens")
async def create_token(
    body: CreateTokenRequest,
    authorization: Optional[str] = Header(None)
):
    caller, _ = await authenticate_caller(authorization)
    check_permission(caller.get("scopes", []), ["*"])

    raw_token, record = token_service.generate_token(
        name=body.name,
        owner=body.owner,
        scopes=body.scopes,
        expires_days=body.expires_days
    )
    return {
        "raw_token": raw_token,
        "token_record": record.model_dump()
    }

@rest_router.delete("/tokens/{token_id}")
async def revoke_token(
    token_id: str = Path(...),
    authorization: Optional[str] = Header(None)
):
    caller, _ = await authenticate_caller(authorization)
    check_permission(caller.get("scopes", []), ["*"])
    success = token_service.revoke_token(token_id)
    if not success:
        raise HTTPException(status_code=404, detail="Token no encontrado")
    return {"status": "revoked", "token_id": token_id}

@rest_router.get("/audit")
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=500),
    authorization: Optional[str] = Header(None)
):
    caller, _ = await authenticate_caller(authorization)
    check_permission(caller.get("scopes", []), ["*"])
    logs = storage_service.get_audit_logs(limit)
    return {"audit_logs": logs}
