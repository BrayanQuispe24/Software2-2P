from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class TipoAgente(str, Enum):
    AFORO = "AFORO"
    COMERCIAL = "COMERCIAL"
    RETENCION = "RETENCION"
    OPERATIVO = "OPERATIVO"
    SEGUIMIENTO = "SEGUIMIENTO"

class SeveridadAlerta(str, Enum):
    INFORMATIVA = "INFORMATIVA"
    PREVENTIVA = "PREVENTIVA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    CRITICA = "CRITICA"

class EstadoAlerta(str, Enum):
    DETECTADA = "DETECTADA"
    NOTIFICADA = "NOTIFICADA"
    EN_ATENCION = "EN_ATENCION"
    ESCALADA = "ESCALADA"
    RESUELTA = "RESUELTA"

class NivelAutonomia(int, Enum):
    OBSERVACION = 0               # Nivel 0: Solo registra indicadores
    ALERTA = 1                    # Nivel 1: Genera avisos internos
    RECOMENDACION = 2             # Nivel 2: Propone acciones al administrador
    AUTOMATIZACION_CONTROLADA = 3 # Nivel 3: Ejecuta acciones autorizadas (n8n)
    ACCION_SENSIBLE = 4           # Nivel 4: Requiere autorización humana explícita

class EstadoAccion(str, Enum):
    SUGERIDA = "SUGERIDA"
    SOLICITADA = "SOLICITADA"
    PENDIENTE_APROBACION = "PENDIENTE_APROBACION"
    APROBADA = "APROBADA"
    RECHAZADA = "RECHAZADA"
    EJECUTADA = "EJECUTADA"
    FALLIDA = "FALLIDA"

class TipoEjecucion(str, Enum):
    PERIODICO = "PERIODICO"
    EVENTO = "EVENTO"
    MANUAL = "MANUAL"

class IndicadorNegocio(BaseModel):
    nombre: str
    valor_actual: float
    valor_referencia: Optional[float] = None
    unidad: str
    sede_id: str
    servicio_origen: str
    confiable: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReglaMonitoreo(BaseModel):
    id: str
    agente_tipo: TipoAgente
    nombre: str
    indicador_clave: str
    sede_id: str = "SEDE-CENTRAL"
    umbral_preventivo: float
    umbral_critico: float
    umbral_cierre_histeresis: Optional[float] = None
    duracion_minima_seg: int = 0
    horario_inicio: Optional[str] = None
    horario_fin: Optional[str] = None
    cooldown_seg: int = 300
    nivel_autonomia: NivelAutonomia = NivelAutonomia.AUTOMATIZACION_CONTROLADA
    activa: bool = True
    destinatarios: List[str] = Field(default_factory=list)

class Anomalia(BaseModel):
    id: Optional[str] = None
    regla_id: str
    agente_tipo: TipoAgente
    sede_id: str
    indicador_clave: str
    valor_observado: float
    valor_referencia: Optional[float] = None
    severidad: SeveridadAlerta
    grado_confianza: float = 1.0
    descripcion: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Alerta(BaseModel):
    id: str
    regla_id: str
    agente_tipo: TipoAgente
    sede_id: str
    titulo: str
    severidad: SeveridadAlerta
    estado: EstadoAlerta = EstadoAlerta.DETECTADA
    valor_observado: float
    valor_referencia: Optional[float] = None
    condicion_activadora: str
    explicacion: str
    recomendacion: str
    origen_explicacion: str = "DETERMINISTICO" # "DETERMINISTICO" o "IA_LOCAL_BROWSER"
    modelo_ia_browser: Optional[str] = None
    grado_confianza: float = 1.0
    contador_ocurrencias: int = 1
    responsable: Optional[str] = None
    evidencia_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ultima_notificacion_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

class AccionAgente(BaseModel):
    id: str
    alerta_id: str
    tipo_accion: str
    nivel_autonomia: NivelAutonomia
    estado: EstadoAccion = EstadoAccion.SUGERIDA
    destinatario: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    resultado: Optional[str] = None
    aprobado_por: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    executed_at: Optional[datetime] = None

class HistorialDecision(BaseModel):
    id: str
    ejecucion_id: str
    agente_tipo: TipoAgente
    sede_id: str
    alerta_id: Optional[str] = None
    que_observo: str
    que_decidio: str
    por_que_decidio: str
    resultado_posterior: Optional[str] = None
    nivel_autonomia: NivelAutonomia
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EjecucionAgente(BaseModel):
    id: str
    agente_tipo: TipoAgente
    tipo_ejecucion: TipoEjecucion = TipoEjecucion.PERIODICO
    anomalias_detectadas: int = 0
    alertas_generadas: int = 0
    alertas_actualizadas: int = 0
    acciones_disparadas: int = 0
    latencia_ms: float = 0.0
    completado: bool = True
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

