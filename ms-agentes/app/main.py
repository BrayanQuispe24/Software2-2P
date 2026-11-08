import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .config import settings
from .infrastructure.db import engine, Base, SessionLocal
from .infrastructure.models import (
    AgenteModel,
    ReglaMonitoreoModel,
    LecturaIndicadorModel,
    AnomaliaModel,
    AlertaModel,
    AccionAgenteModel,
    HistorialDecisionModel,
    EjecucionAgenteModel,
)
from .application.orchestrator_service import AgentOrchestratorService
from .domain.entities import TipoEjecucion
from .presentation.api_router import router as api_router

# Configuración de logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ms-agentes.main")

scheduler = AsyncIOScheduler()

async def scheduled_monitoring_job():
    """Tarea en segundo plano que ejecuta el ciclo de monitoreo periódicamente."""
    logger.info("Ejecutando ciclo periódico de monitoreo del gimnasio (O-A-D-A-E)...")
    db = SessionLocal()
    try:
        resultado = await AgentOrchestratorService.ejecutar_ciclo_completo(
            db=db,
            tipo_ejecucion=TipoEjecucion.PERIODICO
        )
        logger.info(
            f"Ciclo periódico {resultado['ejecucion_id']} completado en {resultado['latencia_ms']}ms. "
            f"Alertas generadas: {resultado['alertas_generadas']}, Actualizadas: {resultado['alertas_actualizadas']}."
        )
    except Exception as e:
        logger.error(f"Error en ciclo periódico de monitoreo: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup: Crear tablas si no existen
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tablas de ms-agentes creadas/verificadas en base de datos.")
    except Exception as e:
        logger.warning(f"Advertencia al crear tablas de base de datos: {e}")

    # Seed inicial
    db = SessionLocal()
    try:
        AgentOrchestratorService.seed_initial_config_if_empty(db)
        logger.info("Agentes lógicos y reglas por defecto inicializadas.")
    finally:
        db.close()

    # Iniciar planificador periódico si está habilitado
    if settings.SCHEDULER_ENABLED:
        scheduler.add_job(
            scheduled_monitoring_job,
            "interval",
            seconds=settings.MONITOR_INTERVAL_SECONDS,
            id="job_monitoreo_periodico",
            replace_existing=True
        )
        scheduler.start()
        logger.info(f"Planificador de monitoreo iniciado (cada {settings.MONITOR_INTERVAL_SECONDS} segundos).")

    yield

    # Shutdown
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Planificador de monitoreo detenido.")

app = FastAPI(
    title="ApexFitness - Microservicio de Agentes Inteligentes (CU-23)",
    description="Agente supervisor autónomo para monitoreo de aforo, actividad comercial, retención, disponibilidad operativa y seguimiento de alertas.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(api_router)

@app.get("/")
def root():
    return {
        "service": "ms-agentes",
        "description": "Agente Inteligente de Monitoreo del Gimnasio (CU-23) de ApexFitness",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

