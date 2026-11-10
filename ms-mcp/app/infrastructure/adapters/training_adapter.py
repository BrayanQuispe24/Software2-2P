import logging
from typing import List, Dict, Any, Optional
import httpx

from ...config import settings

logger = logging.getLogger("ms-mcp.training-adapter")

class TrainingAdapter:
    """
    Adaptador HTTP GraphQL para ms-entrenamiento (puerto 8083).
    Consulta planes de entrenamiento, rutinas asignadas y perfiles clínicos.
    """
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.ENTRENAMIENTO_SERVICE_URL
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
                logger.error("Errores GraphQL en ms-entrenamiento: %s", payload["errors"])
                raise ValueError(f"ms-entrenamiento devolvió errores GraphQL: {payload['errors'][0].get('message', 'Error')}")
            if not isinstance(payload.get("data"), dict):
                raise ValueError("ms-entrenamiento devolvió una estructura incompleta")
            return payload["data"]

    async def get_training_plans(self) -> List[Dict[str, Any]]:
        query = """
        query PlanesEntrenamiento {
            planesEntrenamiento {
                id
                idUsuario
                nombre
                objetivo
                fechaInicio
                fechaFin
                estado
                observacion
                rutinasProgramadas {
                    id
                    diaSemana
                    rutina {
                        id
                        nombre
                        nivel
                    }
                }
            }
        }
        """
        data = await self.execute_graphql(query)
        return data.get("planesEntrenamiento", [])

training_adapter = TrainingAdapter()

