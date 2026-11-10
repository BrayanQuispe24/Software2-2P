import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    SERVICE_NAME: str = "ms-mcp-reportes"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    PORT: int = int(os.getenv("PORT", "8090"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DEFAULT_TIMEZONE: str = os.getenv("DEFAULT_TIMEZONE", "America/La_Paz")
    
    # URLs de microservicios de dominio
    GYM_SERVICE_URL: str = os.getenv("GYM_SERVICE_URL", "http://ms-gimnasio:8082")
    INVENTARIO_SERVICE_URL: str = os.getenv("INVENTARIO_SERVICE_URL", "http://ms-inventario:8084")
    ENTRENAMIENTO_SERVICE_URL: str = os.getenv("ENTRENAMIENTO_SERVICE_URL", "http://ms-entrenamiento:8083")
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://ms-auth:4000")
    AUTH_JWKS_URL: str = os.getenv("AUTH_JWKS_URL", "http://ms-auth:4000/oidc/jwks")
    
    # Directorios de persistencia
    DATA_DIR: Path = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))
    EXPORTS_DIR: Path = Path(os.getenv("EXPORTS_DIR", str(BASE_DIR / "exports")))
    
    # Límites operativos
    SOURCE_TIMEOUT_SECONDS: float = float(os.getenv("SOURCE_TIMEOUT_SECONDS", "10.0"))
    MAX_PAGINATION_PAGES: int = int(os.getenv("MAX_PAGINATION_PAGES", "2000"))
    EXPORT_EXPIRATION_HOURS: int = int(os.getenv("EXPORT_EXPIRATION_HOURS", "24"))
    
    # Tokens predeterminados para integración interna
    AGENT_INTERNAL_TOKEN: str = os.getenv(
        "AGENT_INTERNAL_TOKEN",
        "mcp_agentes_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d"
    )
    GATEWAY_INTERNAL_TOKEN: str = os.getenv(
        "GATEWAY_INTERNAL_TOKEN",
        "mcp_gateway_1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c"
    )
    ADMIN_INIT_TOKEN: str = os.getenv(
        "ADMIN_INIT_TOKEN",
        "mcp_admin_99aa88bb77cc66dd55ee44ff33001122"
    )
    CLAUDE_DEV_TOKEN: str = os.getenv(
        "CLAUDE_DEV_TOKEN",
        "mcp_claude_5566778899aabbccddeeff0011223344"
    )

settings = Settings()

# Asegurar directorios
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

