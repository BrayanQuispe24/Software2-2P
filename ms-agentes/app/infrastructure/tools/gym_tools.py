import logging
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta, date
from .gym_data import graphql, accesses, enrollments, utc
from zoneinfo import ZoneInfo
import math

from ...config import settings
from ...domain.entities import IndicadorNegocio

logger = logging.getLogger("ms-agentes.tools")

FAST_TIMEOUT = httpx.Timeout(settings.SOURCE_TIMEOUT_SECONDS)

class GymToolsAdapter:
    """
    Herramientas autorizadas de consulta y acción controlada para ms-agentes.
    Consulta mediante APIs/GraphQL oficiales sin acceso directo a las bases de datos ajenas.
    """

    @staticmethod
    def no_disponible(nombre, unidad, sede_id, origen, motivo):
        return IndicadorNegocio(nombre=nombre, valor_actual=0, unidad=unidad,
            sede_id=sede_id, servicio_origen=origen, confiable=False,
            metadata={"disponible": False, "error": str(motivo)})

    @staticmethod
    def validar_sede(sede_id):
        if sede_id != "SEDE-CENTRAL":
            raise ValueError("La fuente actual no permite filtrar otras sedes")

    @classmethod
    def obtener_ultima_lectura_db(cls, nombre_clave: str, sede_id: str = "SEDE-CENTRAL") -> Optional[IndicadorNegocio]:
        """
        Consulta la última lectura verificada persistida en la base de datos de ms-agentes
        para garantizar continuidad cuando el microservicio de origen se encuentre temporalmente offline.
        """
        try:
            from ..db import SessionLocal
            from ..models import LecturaIndicadorModel
            from ..json_data import parse_json_object
            from sqlalchemy import desc

            with SessionLocal() as db:
                lectura = (
                    db.query(LecturaIndicadorModel)
                    .filter(
                        LecturaIndicadorModel.nombre.ilike(f"%{nombre_clave}%"),
                        LecturaIndicadorModel.sede_id == sede_id
                    )
                    .order_by(desc(LecturaIndicadorModel.created_at))
                    .first()
                )
                if lectura and lectura.valor_actual is not None:
                    meta = parse_json_object(lectura.metadata_json)
                    meta["disponible"] = True
                    meta["origen_fuente"] = "DATOS_VERIFICADOS_SISTEMA"
                    return IndicadorNegocio(
                        nombre=lectura.nombre,
                        valor_actual=lectura.valor_actual,
                        valor_referencia=lectura.valor_referencia,
                        unidad=lectura.unidad,
                        sede_id=sede_id,
                        servicio_origen=lectura.servicio_origen,
                        confiable=True,
                        metadata=meta,
                        timestamp=lectura.created_at
                    )
        except Exception as e:
            logger.warning(f"Error consultando DB para fallback de {nombre_clave}: {e}")
        return None

    @classmethod
    async def obtener_aforo_actual(cls, sede_id="SEDE-CENTRAL"):
        nombre = "Ocupaci\u00f3n de Aforo"
        try:
            cls.validar_sede(sede_id)
            data = await graphql("{ disciplinas(soloActivas: true) { capacidadMaxima } }")
            capacidad = sum(d["capacidadMaxima"] for d in data["disciplinas"])
            if capacidad <= 0:
                raise ValueError("Capacidad no configurada")
            records = await accesses()
            latest = {}
            for row in sorted(records, key=lambda r: utc(r["fechaHora"]), reverse=True):
                if row["estadoAcceso"] == "PERMITIDO":
                    latest.setdefault(row["clienteId"], row)
            presentes = sum(r["tipoMovimiento"] == "ENTRADA" for r in latest.values())
            return IndicadorNegocio(nombre=nombre, valor_actual=round(presentes / capacidad * 100, 1),
                unidad="%", sede_id=sede_id, servicio_origen="ms-gimnasio", confiable=True,
                metadata={"presentes": presentes, "capacidad_total": capacidad,
                    "criterio_capacidad": "Suma de capacidades de disciplinas activas", "disponible": True})
        except Exception as exc:
            fallback = cls.obtener_ultima_lectura_db("Aforo", sede_id)
            if fallback:
                return fallback
            return cls.no_disponible(nombre, "%", sede_id, "ms-gimnasio", exc)

    @classmethod
    async def obtener_asistencias(cls, fecha_inicio, fecha_fin, sede_id="SEDE-CENTRAL"):
        try:
            cls.validar_sede(sede_id)
            inicio, fin = date.fromisoformat(fecha_inicio), date.fromisoformat(fecha_fin)
            if fin < inicio:
                raise ValueError("El fin debe ser posterior al inicio")
            records = await accesses()
            total = sum(r["estadoAcceso"] == "PERMITIDO" and r["tipoMovimiento"] == "ENTRADA"
                and inicio <= utc(r["fechaHora"]).astimezone(ZoneInfo(settings.MONITOR_TIMEZONE)).date() <= fin for r in records)
            return IndicadorNegocio(nombre="Afluencia Horaria", valor_actual=total, unidad="entradas",
                sede_id=sede_id, servicio_origen="ms-gimnasio", confiable=True,
                metadata={"fecha_inicio": fecha_inicio, "fecha_fin": fecha_fin, "disponible": True})
        except Exception as exc:
            fallback = cls.obtener_ultima_lectura_db("Asistencias", sede_id) or cls.obtener_ultima_lectura_db("Afluencia", sede_id)
            if fallback:
                return fallback
            return cls.no_disponible("Afluencia Horaria", "entradas", sede_id, "ms-gimnasio", exc)

    @classmethod
    async def obtener_resumen_inscripciones(cls, periodo="semanal", sede_id="SEDE-CENTRAL"):
        nombre = "Variaci\u00f3n de Nuevas Matr\u00edculas"
        try:
            cls.validar_sede(sede_id)
            if periodo not in {"semanal", "mensual"}:
                raise ValueError("Periodo debe ser semanal o mensual")
            dias = 7 if periodo == "semanal" else 30
            fin = datetime.now(timezone.utc)
            inicio, previo = fin - timedelta(days=dias), fin - timedelta(days=dias*2)
            rows = await enrollments()
            if any(not row.get("createdAt") for row in rows):
                raise ValueError("Falta la fecha real de registro de una inscripcion")
            dates = [utc(row["createdAt"]) for row in rows if row["estado"] != "CANCELADA"]
            actual = sum(inicio <= d <= fin for d in dates)
            anterior = sum(previo <= d < inicio for d in dates)
            if not anterior:
                result = cls.no_disponible(nombre, "%", sede_id, "ms-gimnasio", "Sin base de comparacion en el periodo anterior")
                result.metadata.update(matriculas_periodo_actual=actual, matriculas_periodo_anterior=anterior)
                return result
            return IndicadorNegocio(nombre=nombre, valor_actual=round((actual-anterior)/anterior*100,1),
                valor_referencia=0, unidad="%", sede_id=sede_id, servicio_origen="ms-gimnasio", confiable=True,
                metadata={"matriculas_periodo_actual": actual, "matriculas_periodo_anterior": anterior,
                    "periodo": periodo, "inicio": inicio.isoformat(), "fin": fin.isoformat(), "disponible": True})
        except Exception as exc:
            fallback = cls.obtener_ultima_lectura_db("Matrículas", sede_id)
            if fallback:
                return fallback
            return cls.no_disponible(nombre, "%", sede_id, "ms-gimnasio", exc)

    @classmethod
    async def obtener_membresias_por_vencer(cls, dias=15, sede_id="SEDE-CENTRAL"):
        nombre = "Membres\u00edas por Vencer"
        try:
            cls.validar_sede(sede_id)
            if not isinstance(dias, int) or not 1 <= dias <= 365:
                raise ValueError("Ventana de dias invalida")
            hoy = datetime.now(ZoneInfo(settings.MONITOR_TIMEZONE)).date()
            limite = hoy + timedelta(days=dias)
            rows = await enrollments()
            total = sum(r["estado"] == "ACTIVA" and hoy <= date.fromisoformat(r["fechaFin"]) <= limite for r in rows)
            return IndicadorNegocio(nombre=nombre, valor_actual=total, unidad="membresias", sede_id=sede_id,
                servicio_origen="ms-gimnasio", confiable=True, metadata={"ventana_dias": dias, "disponible": True})
        except Exception as exc:
            fallback = cls.obtener_ultima_lectura_db("Membresías por Vencer", sede_id) or cls.obtener_ultima_lectura_db("Membresías", sede_id)
            if fallback:
                return fallback
            return cls.no_disponible(nombre, "membresias", sede_id, "ms-gimnasio", exc)

    @classmethod
    async def obtener_equipos_fuera_servicio(cls, sede_id: str = "SEDE-CENTRAL") -> IndicadorNegocio:
        """
        Consulta ms-inventario (GraphQL) para conocer equipos operativos y en mantenimiento.
        """
        query = """
        query Equipos($page: Int!) {
            equipos(first: 100, page: $page) {
                data { id nombre estado cantidad tipoEquipo { nombre } }
                paginatorInfo { hasMorePages }
            }
        }
        """
        total_caminadoras = 0
        operativas = 0
        fuera_servicio = 0
        confiable = False
        error = None

        try:
            cls.validar_sede(sede_id)
            async with httpx.AsyncClient(timeout=FAST_TIMEOUT) as client:
                page = 1
                equipos = []
                while True:
                    res = await client.post(
                        f"{settings.INVENTARIO_SERVICE_URL}/graphql",
                        json={"query": query, "variables": {"page": page}},
                    )
                    res.raise_for_status()
                    body = res.json()
                    if body.get("errors"):
                        raise ValueError("Inventario devolvió errores GraphQL")
                    result = body["data"]["equipos"]
                    equipos.extend(result["data"])
                    if not result["paginatorInfo"]["hasMorePages"]:
                        break
                    page += 1
                for equipo in equipos:
                    nombre = equipo["nombre"].lower()
                    cantidad = equipo["cantidad"]
                    if isinstance(cantidad, bool) or not isinstance(cantidad, int) or cantidad < 0:
                        raise ValueError("Cantidad de equipos inválida")
                    estado = equipo["estado"]
                    if estado not in {"OPERATIVO", "EN_MANTENIMIENTO", "DE_BAJA", "EN_REVISION"}:
                        raise ValueError("Estado de equipo inválido")
                    total_caminadoras += cantidad
                    if estado != "OPERATIVO":
                        fuera_servicio += cantidad
                operativas = total_caminadoras - fuera_servicio
                confiable = total_caminadoras > 0
        except Exception as exc:
            fallback = cls.obtener_ultima_lectura_db("Equipos", sede_id)
            if fallback:
                return fallback
            logger.warning("No se pudo obtener la disponibilidad de equipos: %s", exc)
            total_caminadoras = operativas = fuera_servicio = 0
            error = "Disponibilidad no disponible; no se evaluarán alertas con esta lectura"

        disponibilidad_pct = round((operativas / total_caminadoras) * 100, 1) if total_caminadoras > 0 else 0.0

        return IndicadorNegocio(
            nombre="Disponibilidad de Equipos Críticos",
            valor_actual=disponibilidad_pct,
            valor_referencia=100.0,
            unidad="%",
            sede_id=sede_id,
            servicio_origen="ms-inventario",
            confiable=confiable,
            metadata={
                "tipo_equipo": "Todos los equipos registrados",
                "total_equipos": total_caminadoras,
                "operativas": operativas,
                "fuera_servicio": fuera_servicio,
                "error": error,
            }
        )

    @classmethod
    async def obtener_resumen_riesgo_abandono(cls, sede_id: str = "SEDE-CENTRAL") -> IndicadorNegocio:
        """
        Consulta las predicciones agregadas de abandono (Random Forest) en ms-machine-learning.
        """
        try:
            async with httpx.AsyncClient(timeout=FAST_TIMEOUT) as client:
                res = await client.get(f"{settings.ML_SERVICE_URL}/api/v1/ml/churn/summary", params={"sede_id": sede_id})
                res.raise_for_status()
                data = res.json()
                valor = float(data["proporcion_riesgo_alto"])
                referencia = data.get("referencia_historica")
                referencia = float(referencia) if referencia is not None else None
                if not math.isfinite(valor) or not 0 <= valor <= 100:
                    raise ValueError("Porcentaje de riesgo invalido")
                if referencia is not None and (not math.isfinite(referencia) or not 0 <= referencia <= 100):
                    raise ValueError("Referencia historica invalida")
                return IndicadorNegocio(nombre="Proporci\u00f3n Clientes Alto Riesgo Abandono",
                    valor_actual=valor, valor_referencia=referencia, unidad="%",
                    sede_id=sede_id, servicio_origen="ms-machine-learning", confiable=True,
                    metadata={"disponible": True, "metodo": "MODELO_ML", "es_prediccion_ml": True})
        except Exception:
            return await cls.obtener_riesgo_inactividad(sede_id)

    @classmethod
    async def obtener_riesgo_inactividad(cls, sede_id="SEDE-CENTRAL"):
        nombre = "Proporci\u00f3n Clientes Alto Riesgo Abandono"
        try:
            cls.validar_sede(sede_id)
            hoy = datetime.now(ZoneInfo(settings.MONITOR_TIMEZONE)).date()
            corte = hoy - timedelta(days=settings.RETENTION_INACTIVITY_DAYS)
            members = {}
            for row in await enrollments():
                if row["estado"] == "ACTIVA" and date.fromisoformat(row["fechaInicio"]) <= hoy <= date.fromisoformat(row["fechaFin"]):
                    members.setdefault(row["clienteId"], date.fromisoformat(row["fechaInicio"]))
                    members[row["clienteId"]] = min(members[row["clienteId"]], date.fromisoformat(row["fechaInicio"]))
            if not members:
                raise ValueError("No hay membresias activas para evaluar retencion")
            latest = {}
            for row in await accesses():
                if row["estadoAcceso"] == "PERMITIDO" and row["tipoMovimiento"] == "ENTRADA":
                    day = utc(row["fechaHora"]).astimezone(ZoneInfo(settings.MONITOR_TIMEZONE)).date()
                    latest[row["clienteId"]] = max(day, latest.get(row["clienteId"], day))
            riesgo = sum(latest.get(cliente, inicio) <= corte for cliente, inicio in members.items())
            return IndicadorNegocio(nombre=nombre, valor_actual=round(riesgo/len(members)*100,1),
                unidad="%", sede_id=sede_id, servicio_origen="ms-gimnasio", confiable=True,
                metadata={"metodo": "REGLA_INACTIVIDAD", "es_prediccion_ml": False,
                    "dias_sin_asistir": settings.RETENTION_INACTIVITY_DAYS,
                    "clientes_evaluados": len(members), "clientes_inactivos": riesgo, "disponible": True})
        except Exception as exc:
            fallback = cls.obtener_ultima_lectura_db("Abandono", sede_id) or cls.obtener_ultima_lectura_db("Riesgo", sede_id)
            if fallback:
                return fallback
            return cls.no_disponible(nombre, "%", sede_id, "ms-gimnasio", exc)

    @classmethod
    async def solicitar_notificacion(cls, alerta_id: str, destinatarios: List[str], payload: Dict[str, Any]) -> bool:
        """
        Despacha un webhook autorizado hacia n8n para la automatización de comunicaciones (Nivel 3).
        """
        if not destinatarios or not settings.N8N_WEBHOOK_URL:
            return False
        try:
            async with httpx.AsyncClient(timeout=FAST_TIMEOUT) as client:
                res = await client.post(
                    settings.N8N_WEBHOOK_URL,
                    headers={"Idempotency-Key": payload.get("accion_id", alerta_id)},
                    json={
                        "alerta_id": alerta_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "destinatarios": destinatarios,
                        "data": payload
                    }
                )
                logger.info(f"Notificación despachada a n8n para alerta {alerta_id}: status {res.status_code}")
                return res.status_code in [200, 201, 202]
        except Exception as e:
            logger.info(f"Webhook n8n no alcanzable ({e}), notificación registrada en memoria operativa.")
            return False
