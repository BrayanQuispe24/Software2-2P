import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
)
from .db import Base

class AgenteModel(Base):
    __tablename__ = "agentes"

    id = Column(String(50), primary_key=True)
    tipo = Column(String(50), nullable=False, unique=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    nivel_autonomia_maximo = Column(Integer, default=3)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ReglaMonitoreoModel(Base):
    __tablename__ = "reglas_monitoreo"

    id = Column(String(50), primary_key=True)
    agente_tipo = Column(String(50), nullable=False)
    nombre = Column(String(150), nullable=False)
    indicador_clave = Column(String(100), nullable=False)
    sede_id = Column(String(50), default="SEDE-CENTRAL")
    umbral_preventivo = Column(Float, nullable=False)
    umbral_critico = Column(Float, nullable=False)
    umbral_cierre_histeresis = Column(Float, nullable=True)
    duracion_minima_seg = Column(Integer, default=0)
    horario_inicio = Column(String(5), nullable=True)
    horario_fin = Column(String(5), nullable=True)
    anomalia_desde = Column(DateTime, nullable=True)
    cooldown_seg = Column(Integer, default=300)
    nivel_autonomia = Column(Integer, default=3)
    activa = Column(Boolean, default=True)
    destinatarios_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def destinatarios(self):
        try:
            return json.loads(self.destinatarios_json or "[]")
        except Exception:
            return []

    @destinatarios.setter
    def destinatarios(self, val):
        self.destinatarios_json = json.dumps(val or [])

class LecturaIndicadorModel(Base):
    __tablename__ = "lecturas_indicador"

    id = Column(String(50), primary_key=True)
    ejecucion_id = Column(String(50), nullable=True)
    nombre = Column(String(100), nullable=False)
    valor_actual = Column(Float, nullable=False)
    valor_referencia = Column(Float, nullable=True)
    unidad = Column(String(20), nullable=False)
    sede_id = Column(String(50), nullable=False)
    servicio_origen = Column(String(50), nullable=False)
    confiable = Column(Boolean, default=True)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AnomaliaModel(Base):
    __tablename__ = "anomalias"

    id = Column(String(50), primary_key=True)
    regla_id = Column(String(50), nullable=False)
    agente_tipo = Column(String(50), nullable=False)
    sede_id = Column(String(50), nullable=False)
    indicador_clave = Column(String(100), nullable=False)
    valor_observado = Column(Float, nullable=False)
    valor_referencia = Column(Float, nullable=True)
    severidad = Column(String(30), nullable=False)
    grado_confianza = Column(Float, default=1.0)
    descripcion = Column(Text, nullable=False)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AlertaModel(Base):
    __tablename__ = "alertas"

    id = Column(String(50), primary_key=True)
    regla_id = Column(String(50), nullable=False)
    agente_tipo = Column(String(50), nullable=False)
    sede_id = Column(String(50), nullable=False)
    titulo = Column(String(200), nullable=False)
    severidad = Column(String(30), nullable=False)
    estado = Column(String(30), default="DETECTADA") # DETECTADA, NOTIFICADA, EN_ATENCION, ESCALADA, RESUELTA
    valor_observado = Column(Float, nullable=False)
    valor_referencia = Column(Float, nullable=True)
    condicion_activadora = Column(String(200), nullable=False)
    explicacion = Column(Text, nullable=False)
    recomendacion = Column(Text, nullable=False)
    origen_explicacion = Column(String(50), default="DETERMINISTICO") # DETERMINISTICO o IA_LOCAL_BROWSER
    modelo_ia_browser = Column(String(100), nullable=True)
    grado_confianza = Column(Float, default=1.0)
    contador_ocurrencias = Column(Integer, default=1)
    responsable = Column(String(100), nullable=True)
    evidencia_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ultima_notificacion_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

class AccionAgenteModel(Base):
    __tablename__ = "acciones_agente"

    id = Column(String(50), primary_key=True)
    alerta_id = Column(String(50), nullable=False)
    tipo_accion = Column(String(100), nullable=False)
    nivel_autonomia = Column(Integer, nullable=False)
    estado = Column(String(30), default="SUGERIDA") # SUGERIDA, SOLICITADA, PENDIENTE_APROBACION, APROBADA, RECHAZADA, EJECUTADA
    destinatario = Column(String(100), nullable=True)
    payload_json = Column(Text, default="{}")
    resultado = Column(Text, nullable=True)
    aprobado_por = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    executed_at = Column(DateTime, nullable=True)

class HistorialDecisionModel(Base):
    __tablename__ = "historial_decisiones"

    id = Column(String(50), primary_key=True)
    ejecucion_id = Column(String(50), nullable=False)
    agente_tipo = Column(String(50), nullable=False)
    sede_id = Column(String(50), nullable=False)
    alerta_id = Column(String(50), nullable=True)
    que_observo = Column(Text, nullable=False)
    que_decidio = Column(Text, nullable=False)
    por_que_decidio = Column(Text, nullable=False)
    resultado_posterior = Column(Text, nullable=True)
    nivel_autonomia = Column(Integer, default=3)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class EjecucionAgenteModel(Base):
    __tablename__ = "ejecuciones_agente"

    id = Column(String(50), primary_key=True)
    agente_tipo = Column(String(50), nullable=False)
    tipo_ejecucion = Column(String(30), default="PERIODICO")
    anomalias_detectadas = Column(Integer, default=0)
    alertas_generadas = Column(Integer, default=0)
    alertas_actualizadas = Column(Integer, default=0)
    acciones_disparadas = Column(Integer, default=0)
    latencia_ms = Column(Float, default=0.0)
    completado = Column(Boolean, default=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

