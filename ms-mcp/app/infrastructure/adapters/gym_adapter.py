import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import List, Dict, Any, Optional
import httpx

from ...config import settings

logger = logging.getLogger("ms-mcp.gym-adapter")

def parse_utc(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)

def to_local_date(dt: datetime, tz_name: str = "America/La_Paz"):
    return dt.astimezone(ZoneInfo(tz_name)).date()

class GymAdapter:
    """
    Adaptador HTTP GraphQL oficial para ms-gimnasio (puerto 8082).
    Consulta asistencias, inscripciones, disciplinas, horarios y pagos sin acceder a la base de datos SQL.
    """
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.GYM_SERVICE_URL
        self.timeout = httpx.Timeout(settings.SOURCE_TIMEOUT_SECONDS)

    async def execute_graphql(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(
                f"{self.base_url}/graphql",
                json={"query": query, "variables": variables or {}}
            )
            resp.raise_for_status()
            payload = resp.json()
            if payload.get("errors"):
                logger.error("Errores GraphQL en ms-gimnasio: %s", payload["errors"])
                raise ValueError(f"ms-gimnasio devolvió errores GraphQL: {payload['errors'][0].get('message', 'Error desconocido')}")
            if not isinstance(payload.get("data"), dict):
                raise ValueError("ms-gimnasio devolvió una estructura incompleta")
            return payload["data"]

    async def get_all_accesses(self, max_pages: int = 2000) -> List[Dict[str, Any]]:
        """
        Recorre todas las páginas de registros de acceso de forma determinista y deduplica por ID.
        """
        records: List[Dict[str, Any]] = []
        seen_ids = set()
        query = """
        query AccessPages($page: Int!) {
            registrosAccesoPagina(pagina: $page, limite: 500) {
                id
                clienteId
                tipoMovimiento
                estadoAcceso
                fechaHora
                dispositivoTorniquete
                motivoDenegacion
            }
        }
        """
        for page in range(max_pages):
            data = await self.execute_graphql(query, {"page": page})
            batch = data.get("registrosAccesoPagina", [])
            if not isinstance(batch, list):
                raise ValueError("Respuesta de página de accesos no es una lista")
            for item in batch:
                if item["id"] not in seen_ids:
                    records.append(item)
                    seen_ids.add(item["id"])
            if len(batch) < 500:
                break
        return records

    async def get_all_enrollments(self, max_pages: int = 2000) -> List[Dict[str, Any]]:
        """
        Recorre todas las páginas de inscripciones con boleta de pago anidada.
        """
        rows: List[Dict[str, Any]] = []
        seen_ids = set()
        query = """
        query EnrollmentPages($page: Int!) {
            inscripcionesPagina(pagina: $page, limite: 500) {
                id
                codigoMatricula
                clienteId
                fechaInicio
                fechaFin
                totalSesiones
                sesionesConsumidas
                estado
                createdAt
                plan {
                    id
                    nombre
                    duracionDias
                    tipoAcceso
                }
                disciplina {
                    id
                    codigo
                    nombre
                }
                disciplinaHorario {
                    id
                    instructorId
                    horario {
                        diaSemana
                        horaInicio
                        horaFin
                        turno
                    }
                }
                boletaPago {
                    id
                    numeroComprobante
                    montoSubtotal
                    montoDescuento
                    montoTotal
                    metodoPago
                    estado
                    fechaPago
                    createdAt
                    tarifa {
                        monto
                        moneda
                    }
                }
            }
        }
        """
        for page in range(max_pages):
            data = await self.execute_graphql(query, {"page": page})
            batch = data.get("inscripcionesPagina", [])
            if not isinstance(batch, list):
                raise ValueError("Respuesta de página de inscripciones no es una lista")
            for item in batch:
                if item["id"] not in seen_ids:
                    rows.append(item)
                    seen_ids.add(item["id"])
            if len(batch) < 500:
                break
        return rows

    async def get_disciplines_and_schedules(self) -> List[Dict[str, Any]]:
        query = """
        query Catalog {
            disciplinas(soloActivas: false) {
                id
                codigo
                nombre
                capacidadMaxima
                activo
                horarios {
                    id
                    instructorId
                    cupoDisponible
                    activo
                    horario {
                        id
                        diaSemana
                        horaInicio
                        horaFin
                        turno
                        capacidadAforo
                    }
                }
            }
        }
        """
        data = await self.execute_graphql(query)
        return data.get("disciplinas", [])

gym_adapter = GymAdapter()

