import logging
from typing import List, Dict, Any, Optional
import httpx

from ...config import settings

logger = logging.getLogger("ms-mcp.auth-adapter")

class AuthAdapter:
    """
    Adaptador HTTP para ms-auth (puerto 4000).
    Consulta usuarios, nombres e identidades del sistema centralizado SSO.
    """
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.AUTH_SERVICE_URL
        self.timeout = httpx.Timeout(settings.SOURCE_TIMEOUT_SECONDS)

    async def get_users(self) -> List[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{self.base_url}/users")
                if resp.status_code == 200:
                    data = resp.json()
                    return data if isinstance(data, list) else data.get("data", [])
        except Exception as exc:
            logger.warning("No se pudo consultar el directorio de usuarios de ms-auth: %s", exc)
        return []

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{self.base_url}/users/{user_id}")
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            pass
        return None

auth_adapter = AuthAdapter()

