from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ReportStatus(str, Enum):
    COMPLETO = "COMPLETO"
    PARCIAL = "PARCIAL"
    SIN_DATOS = "SIN_DATOS"
    NO_DISPONIBLE = "NO_DISPONIBLE"
    NO_IMPLEMENTADO = "NO_IMPLEMENTADO"

class ScopeEnum(str, Enum):
    ASISTENCIA = "asistencia"
    MEMBRESIAS = "membresias"
    INVENTARIO = "inventario"
    FINANZAS = "finanzas"
    ENTRENAMIENTO = "entrenamiento"
    IDENTIDADES = "identidades"
    EXPORTACIONES = "exportaciones"
    ALL = "*"

class ExportFormat(str, Enum):
    CSV = "CSV"
    PDF = "PDF"

class SourceCoverage(BaseModel):
    servicio: str
    tipo: str  # REST / GraphQL
    estado: str  # OK / FALLIDO / NO_CONFIGURADO
    detalles: Optional[str] = None

class ReportResult(BaseModel):
    herramienta: str
    titulo: str
    periodo_interpretado: str
    zona_horaria: str = "America/La_Paz"
    fecha_corte: str
    fuentes_consultadas: List[SourceCoverage]
    cobertura: str
    totales: Dict[str, Any] = Field(default_factory=dict)
    filas: List[Dict[str, Any]] = Field(default_factory=list)
    total_filas: int = 0
    definicion: str
    advertencias: List[str] = Field(default_factory=list)
    estado: ReportStatus
    metadatos: Dict[str, Any] = Field(default_factory=dict)

class ToolParameter(BaseModel):
    nombre: str
    tipo: str
    descripcion: str
    requerido: bool = False
    predeterminado: Optional[Any] = None
    ejemplo: Optional[Any] = None

class ToolMetadata(BaseModel):
    nombre: str
    titulo: str
    descripcion: str
    reportes_asociados: List[int]
    categoria: str
    scopes_requeridos: List[str]
    parametros: List[ToolParameter]
    estado_cobertura: ReportStatus

class TokenRecord(BaseModel):
    token_id: str
    name: str
    token_prefix: str
    owner: str
    scopes: List[str]
    created_at: str
    expires_at: Optional[str] = None
    revoked: bool = False

class ExportFileRecord(BaseModel):
    file_id: str
    filename: str
    file_path: str
    formato: ExportFormat
    reporte_nombre: str
    tamanio_bytes: int
    created_at: str
    expires_at: str

