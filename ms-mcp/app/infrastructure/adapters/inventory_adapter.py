import logging
from typing import List, Dict, Any, Optional
import httpx

from ...config import settings

logger = logging.getLogger("ms-mcp.inventory-adapter")

class InventoryAdapter:
    """
    Adaptador HTTP GraphQL para ms-inventario (puerto 8084).
    Consulta equipos, estados de máquinas, mantenimientos preventivos y correctivos.
    """
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.INVENTARIO_SERVICE_URL
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
                logger.error("Errores GraphQL en ms-inventario: %s", payload["errors"])
                raise ValueError(f"ms-inventario devolvió errores GraphQL: {payload['errors'][0].get('message', 'Error')}")
            if not isinstance(payload.get("data"), dict):
                raise ValueError("ms-inventario devolvió una estructura incompleta")
            return payload["data"]

    async def get_all_equipment(self) -> List[Dict[str, Any]]:
        equipos = []
        page = 1
        query = """
        query EquiposPaginados($page: Int!) {
            equipos(first: 100, page: $page) {
                data {
                    id
                    codigo
                    nombre
                    modelo
                    fechaAdquisicion
                    precioCompra
                    estado
                    cantidad
                    tipoEquipo {
                        id
                        nombre
                    }
                    ambiente {
                        id
                        nombre
                    }
                    marca {
                        id
                        nombre
                    }
                }
                paginatorInfo {
                    hasMorePages
                }
            }
        }
        """
        while True:
            data = await self.execute_graphql(query, {"page": page})
            result = data.get("equipos", {})
            batch = result.get("data", [])
            equipos.extend(batch)
            if not result.get("paginatorInfo", {}).get("hasMorePages", False):
                break
            page += 1
            if page > 50:
                break
        return equipos

    async def get_all_maintenances(self) -> List[Dict[str, Any]]:
        query = """
        query Mantenimientos {
            mantenimientos {
                id
                tipo
                fechaInicio
                fechaFin
                descripcion
                costo
                estado
                proximoMantenimiento
                observacion
                equipo {
                    id
                    codigo
                    nombre
                    estado
                    tipoEquipo {
                        nombre
                    }
                }
            }
        }
        """
        data = await self.execute_graphql(query)
        return data.get("mantenimientos", [])

    async def get_upcoming_maintenances(self, dias_margen: int = 7) -> List[Dict[str, Any]]:
        query = """
        query ProximosMantenimientos($dias: Int!) {
            alertasMantenimientoProximo(diasMargen: $dias) {
                id
                tipo
                fechaInicio
                fechaFin
                descripcion
                costo
                estado
                proximoMantenimiento
                equipo {
                    id
                    codigo
                    nombre
                }
            }
        }
        """
        data = await self.execute_graphql(query, {"dias": dias_margen})
        return data.get("alertasMantenimientoProximo", [])

inventory_adapter = InventoryAdapter()

