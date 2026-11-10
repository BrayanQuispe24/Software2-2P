import httpx
import logging
from typing import Dict, Any, Optional

from ...config import settings

logger = logging.getLogger("ms-agentes.mcp-client")

class McpClient:
    """Cliente HTTP / JSON-RPC para interactuar con ms-mcp."""

    def __init__(self):
        self.base_url = settings.MCP_SERVICE_URL.rstrip("/")
        self.token = settings.MCP_INTERNAL_TOKEN

    async def call_tool(self, tool_name: str, arguments: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Ejecuta una herramienta en el servidor MCP utilizando el protocolo JSON-RPC 2.0.
        """
        arguments = arguments or {}
        payload = {
            "jsonrpc": "2.0",
            "id": f"agente-{tool_name}",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(f"{self.base_url}/mcp", json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                if "error" in data:
                    raise RuntimeError(f"Error MCP ({data['error'].get('code')}): {data['error'].get('message')}")
                return data.get("result", {})
            except Exception as exc:
                logger.warning(f"No se pudo invocar herramienta MCP '{tool_name}': {exc}")
                raise

mcp_client = McpClient()

