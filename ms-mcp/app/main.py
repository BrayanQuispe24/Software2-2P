import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .infrastructure.db.storage import storage_service
from .presentation.mcp_server import router as mcp_router
from .presentation.api_router import rest_router

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ms-mcp")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando ApexFitness Reports MCP Service...")
    # Asegurar que el almacenamiento y tokens semilla están listos
    storage_service._init_db()
    logger.info(f"Base de datos SQLite y directorio de exportaciones listos ({settings.EXPORTS_DIR})")
    yield
    logger.info("Deteniendo ApexFitness Reports MCP Service...")

app = FastAPI(
    title="ApexFitness Reports & Intelligence MCP",
    version="1.0.0",
    description="Servidor de herramientas analíticas MCP y API de Reportes para gimnasios.",
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

# Montar MCP routers directamente en la raíz para /mcp, /sse, /messages
app.include_router(mcp_router, tags=["MCP Protocol"])

# Montar API REST bajo /api/v1 y /api
app.include_router(rest_router, prefix="/api/v1", tags=["Reports REST API"])
app.include_router(rest_router, prefix="/api", tags=["Reports REST API Alias"])

@app.get("/")
def root_info():
    return {
        "service": "ApexFitness Reports MCP Server",
        "status": "OPERATIONAL",
        "protocol": "MCP 2024-11-05",
        "endpoints": {
            "mcp_streamable_http": "/mcp",
            "mcp_sse": "/sse",
            "mcp_messages": "/messages",
            "rest_capacidades": "/api/v1/capacidades",
            "rest_tools": "/api/v1/tools",
            "rest_execute": "/api/v1/tools/execute",
            "rest_export": "/api/v1/exportar",
            "health": "/api/v1/health/ready"
        }
    }

