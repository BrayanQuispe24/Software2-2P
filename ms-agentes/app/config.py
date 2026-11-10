from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ms-agentes"
    PORT: int = 8085
    DATABASE_URL: str = "postgresql://agentes_user:agentes_dev_password@localhost:5436/ms_agentes_db"
    
    # Servicios externos (GraphQL / REST / MCP)
    GYM_SERVICE_URL: str = "http://localhost:8082"
    INVENTARIO_SERVICE_URL: str = "http://localhost:8084"
    ENTRENAMIENTO_SERVICE_URL: str = "http://localhost:8083"
    ML_SERVICE_URL: str = "http://localhost:8000"
    N8N_WEBHOOK_URL: str = "http://localhost:5678/webhook/agente-alerta"
    MCP_SERVICE_URL: str = "http://localhost:8090"
    MCP_INTERNAL_TOKEN: str = "af_mcp_agente_prod_2026_k83m1"

    # Planificador
    SCHEDULER_ENABLED: bool = True
    MONITOR_INTERVAL_SECONDS: int = 30
    INTERNAL_API_TOKEN: str = ""
    MAX_READING_AGE_SECONDS: int = 120
    SOURCE_TIMEOUT_SECONDS: float = 5.0
    RETENTION_INACTIVITY_DAYS: int = 14
    MONITOR_TIMEZONE: str = "America/La_Paz"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

