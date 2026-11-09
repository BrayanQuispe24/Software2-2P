import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from ..config import settings

DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
options = {"pool_pre_ping": True}
if DATABASE_URL.startswith("postgresql"):
    options.update(pool_size=10, max_overflow=20, connect_args={"connect_timeout": 5})
elif DATABASE_URL.startswith("sqlite"):
    options["connect_args"] = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, **options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    with SessionLocal() as db:
        yield db
