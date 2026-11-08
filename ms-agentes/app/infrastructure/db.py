import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("ms-agentes.db")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://agentes_user:agentes_dev_password@localhost:5436/ms_agentes_db"
)

# Soporte para PostgreSQL con fallback resiliente a SQLite local si no está levantado
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        connect_args={"connect_timeout": 3} if "postgresql" in DATABASE_URL else {}
    )
    # Probar conexión
    with engine.connect() as conn:
        logger.info(f"Conexión exitosa a la base de datos principal: {DATABASE_URL.split('@')[-1]}")
except Exception as e:
    logger.warning(f"No se pudo conectar a la base de datos PostgreSQL ({e}). Usando SQLite local de fallback.")
    SQLITE_FALLBACK = "sqlite:///./ms_agentes_fallback.db"
    engine = create_engine(SQLITE_FALLBACK, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

