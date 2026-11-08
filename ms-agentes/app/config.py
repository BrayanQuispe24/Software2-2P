from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ms-agentes"
    PORT: int = 8085
    DATABASE_URL: str = "postgresql://agentes_user:agentes_dev_password@localhost:5436/ms_agentes_db"
    
    # Servicios externos (GraphQL / REST)
    GYM_SERVICE_URL: str = "http://localhost:8082"
    INVENTARIO_SERVICE_URL: str = "http://localhost:8084"
    ENTRENAMIENTO_SERVICE_URL: str = "http://localhost:8083"
    ML_SERVICE_URL: str = "http://localhost:8000"
    N8N_WEBHOOK_URL: str = "http://localhost:5678/webhook/agente-alerta"

    # Planificador
    SCHEDULER_ENABLED: bool = True
    MONITOR_INTERVAL_SECONDS: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

