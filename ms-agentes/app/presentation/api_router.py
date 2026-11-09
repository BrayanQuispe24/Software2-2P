import json
import uuid
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta, time
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Literal
from sqlalchemy.orm import Session
from sqlalchemy import desc, text, func

from ..infrastructure.db import get_db
from ..infrastructure.json_data import parse_json_object
from ..infrastructure.models import (
    AgenteModel,
    ReglaMonitoreoModel,
    AlertaModel,
    AccionAgenteModel,
    HistorialDecisionModel,
    EjecucionAgenteModel,
    LecturaIndicadorModel,
    AnomaliaModel,
)
from ..domain.entities import (
    TipoEjecucion,
    EstadoAlerta,
    EstadoAccion,
    SeveridadAlerta,
    NivelAutonomia,
)
from ..application.orchestrator_service import AgentOrchestratorService
from ..infrastructure.tools.gym_tools import GymToolsAdapter
from ..infrastructure.security import require_admin
from ..config import settings

logger = logging.getLogger("ms-agentes.router")

router = APIRouter(prefix="/api/v1", tags=["Agente Inteligente CU-23"])

# Schemas para requests
class ActualizarEstadoAlertaDTO(BaseModel):
    estado: EstadoAlerta
    responsable: Optional[str] = None
    motivo: Optional[str] = None

class EjecutarCicloDTO(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tipo_ejecucion: Literal["MANUAL", "EVENTO", "PERIODICO"] = "MANUAL"

class ActualizarReglaDTO(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="forbid")
    umbral_preventivo: float
    umbral_critico: float
    umbral_cierre_histeresis: Optional[float] = None
    cooldown_seg: int = Field(default=300, ge=1, le=86400)
    duracion_minima_seg: int = Field(default=0, ge=0, le=86400)
    horario_inicio: Optional[str] = None
    horario_fin: Optional[str] = None
    nivel_autonomia: int = Field(default=2, ge=0, le=4)
    activa: bool = True
    destinatarios: Optional[List[str]] = None

    @model_validator(mode="after")
    def validar_horario(self):
        if bool(self.horario_inicio) != bool(self.horario_fin):
            raise ValueError("Indica ambas horas o ninguna")
        for clock in (self.horario_inicio, self.horario_fin):
            if clock and (len(clock) != 5 or time.fromisoformat(clock).strftime("%H:%M") != clock):
                raise ValueError("Hora inválida; usa HH:MM")
        if self.horario_inicio and self.horario_inicio == self.horario_fin:
            raise ValueError("El horario no puede comenzar y terminar a la misma hora")
        if self.destinatarios and (len(self.destinatarios) > 20 or any(not d.strip() or len(d) > 255 for d in self.destinatarios)):
            raise ValueError("Destinatarios inválidos")
        return self

class AutorizarAccionDTO(BaseModel):
    accion_id: Optional[str] = None
    aprobado: bool
    aprobado_por: Optional[str] = None
    comentario: Optional[str] = None

class ToolExecutionDTO(BaseModel):
    tool_name: str
    params: Dict[str, Any] = Field(default_factory=dict)

class AgenteConfigDTO(BaseModel):
    activo: bool
    nivel_autonomia_maximo: int = Field(ge=0, le=4)

@router.put("/agentes/{tipo}", dependencies=[Depends(require_admin)])
def configure_agent(tipo: str, dto: AgenteConfigDTO, db: Session = Depends(get_db)):
    agent = db.query(AgenteModel).filter_by(tipo=tipo).first()
    if not agent:
        raise HTTPException(404, "Agente no encontrado")
    agent.activo, agent.nivel_autonomia_maximo = dto.activo, dto.nivel_autonomia_maximo
    db.commit()
    return {"tipo": agent.tipo, "activo": agent.activo, "nivel_autonomia_maximo": agent.nivel_autonomia_maximo}

class ExplicacionIaDTO(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    explicacion: str = Field(min_length=10, max_length=10000)
    recomendacion: str = Field(min_length=3, max_length=10000)
    modelo_ia_browser: str = Field(min_length=1, max_length=100)
    evidencia_hash: str = Field(min_length=64, max_length=64)
    tokens_segundo: Optional[float] = Field(default=None, ge=0)

def evidence_hash(alert):
    facts = {"valor_observado": alert.valor_observado,
        "evidencia": parse_json_object(alert.evidencia_json), "estado": alert.estado}
    return hashlib.sha256(json.dumps(facts, sort_keys=True, ensure_ascii=True).encode()).hexdigest()

def latest_readings(db):
    latest = db.query(LecturaIndicadorModel.nombre.label("nombre"),
        func.max(LecturaIndicadorModel.created_at).label("fecha")).group_by(LecturaIndicadorModel.nombre).subquery()
    return db.query(LecturaIndicadorModel).join(latest,
        (LecturaIndicadorModel.nombre == latest.c.nombre) &
        (LecturaIndicadorModel.created_at == latest.c.fecha)).all()

@router.patch("/alertas/{alerta_id}/explicacion-ia")
def sync_explanation(alerta_id: str, dto: ExplicacionIaDTO, db: Session = Depends(get_db)):
    alert = db.query(AlertaModel).filter_by(id=alerta_id).with_for_update().first()
    if not alert:
        raise HTTPException(404, "Alerta no encontrada")
    if dto.evidencia_hash != evidence_hash(alert):
        raise HTTPException(409, "La evidencia cambió durante el análisis; actualiza la alerta")
    # AI text is explanatory, never an input to critical rules or a verified fact.
    alert.explicacion, alert.recomendacion = dto.explicacion, dto.recomendacion
    alert.origen_explicacion, alert.modelo_ia_browser = "IA_LOCAL_BROWSER", dto.modelo_ia_browser
    db.add(HistorialDecisionModel(id=f"DEC-{uuid.uuid4().hex}", ejecucion_id="BROWSER-LLM",
        agente_tipo=alert.agente_tipo, sede_id=alert.sede_id, alerta_id=alert.id,
        que_observo=f"Evidencia {dto.evidencia_hash}; modelo {dto.modelo_ia_browser}",
        que_decidio="Redactar explicación asistida por IA; requiere revisión humana",
        por_que_decidio=json.dumps({"explicacion": dto.explicacion, "recomendacion": dto.recomendacion,
            "tokens_segundo": dto.tokens_segundo}, ensure_ascii=False), nivel_autonomia=2))
    db.commit()
    return {"message": "Explicación guardada y auditada", "alerta_id": alert.id}

@router.get("/acciones")
def list_actions(db: Session = Depends(get_db)):
    actions = db.query(AccionAgenteModel).order_by(desc(AccionAgenteModel.created_at)).limit(100).all()
    alerts = {a.id: a for a in db.query(AlertaModel).filter(AlertaModel.id.in_([a.alerta_id for a in actions])).all()}
    rules = {r.id: r for r in db.query(ReglaMonitoreoModel).filter(ReglaMonitoreoModel.id.in_([a.regla_id for a in alerts.values()])).all()}
    def readiness(action):
        alert = alerts.get(action.alerta_id)
        rule = rules.get(alert.regla_id) if alert else None
        reason = None
        if action.estado == EstadoAccion.APROBADA.value:
            if not alert or alert.estado == EstadoAlerta.RESUELTA.value:
                reason = "La alerta ya no requiere una acción operativa"
            elif not rule or not rule.destinatarios:
                reason = "Configura los destinatarios de la regla antes de despachar"
            else:
                payload = parse_json_object(action.payload_json)
                if payload.get("valor_observado") != alert.valor_observado or payload.get("evidencia") != parse_json_object(alert.evidencia_json):
                    reason = "La evidencia cambió; revisa una nueva propuesta antes de despachar"
        return {"regla_id": rule.id if rule else None, "motivo_bloqueo": reason,
            "puede_despachar": action.estado == EstadoAccion.APROBADA.value and not reason}
    return [{"id": a.id, "alerta_id": a.alerta_id, "tipo_accion": a.tipo_accion,
        **readiness(a),
        "estado": a.estado, "nivel_autonomia": a.nivel_autonomia,
        "resultado": a.resultado, "aprobado_por": a.aprobado_por,
        "propuesta": parse_json_object(a.payload_json).get("accion"),
        "executed_at": a.executed_at.isoformat() if a.executed_at else None}
        for a in actions]

# 1. Health
@router.get("/health/ready")
def health_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {
        "status": "ready",
        "service": "ms-agentes",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# 2. Resumen / Dashboard KPIs
@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    AgentOrchestratorService.seed_initial_config_if_empty(db)

    # Última lectura de aforo
    ultima_lectura_aforo = (
        db.query(LecturaIndicadorModel)
        .filter(LecturaIndicadorModel.nombre == "Ocupación de Aforo")
        .order_by(desc(LecturaIndicadorModel.created_at))
        .first()
    )
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.MAX_READING_AGE_SECONDS)
    aforo_disponible = bool(ultima_lectura_aforo and ultima_lectura_aforo.confiable
        and AgentOrchestratorService.utc(ultima_lectura_aforo.created_at) >= cutoff)
    aforo_actual = ultima_lectura_aforo.valor_actual if aforo_disponible else None
    meta_aforo = parse_json_object(ultima_lectura_aforo.metadata_json) if ultima_lectura_aforo else {}

    # Alertas abiertas
    alertas_abiertas = (
        db.query(AlertaModel)
        .filter(AlertaModel.estado.in_([
            EstadoAlerta.DETECTADA.value,
            EstadoAlerta.NOTIFICADA.value,
            EstadoAlerta.EN_ATENCION.value,
            EstadoAlerta.ESCALADA.value
        ]))
        .all()
    )
    criticas_count = sum(1 for a in alertas_abiertas if a.severidad in [SeveridadAlerta.CRITICA.value, SeveridadAlerta.ALTA.value])

    # Reglas activas
    reglas_activas_count = db.query(ReglaMonitoreoModel).filter_by(activa=True).count()

    # Agentes
    agentes = db.query(AgenteModel).all()

    # Métricas de calidad y validación (Sección 13)
    total_alertas = db.query(AlertaModel).count()
    alertas_resueltas = db.query(AlertaModel).filter_by(estado=EstadoAlerta.RESUELTA.value).count()
    acciones_sensibles_no_autorizadas = (
        db.query(AccionAgenteModel)
        .filter(
            AccionAgenteModel.nivel_autonomia == NivelAutonomia.ACCION_SENSIBLE.value,
            AccionAgenteModel.estado == EstadoAccion.EJECUTADA.value,
            AccionAgenteModel.aprobado_por.is_(None)
        )
        .count()
    )

    # Cálculo de latencia promedio de los últimos 20 ciclos
    ultimas_ejecuciones = (
        db.query(EjecucionAgenteModel)
        .order_by(desc(EjecucionAgenteModel.created_at))
        .limit(20)
        .all()
    )
    latencia_media_ms = (
        sum(e.latencia_ms for e in ultimas_ejecuciones) / len(ultimas_ejecuciones)
        if ultimas_ejecuciones else None
    )

    return {
        "monitoreo_activo": bool(settings.SCHEDULER_ENABLED and ultimas_ejecuciones and
            AgentOrchestratorService.utc(ultimas_ejecuciones[0].created_at) >= cutoff),
        "intervalo_segundos": settings.MONITOR_INTERVAL_SECONDS,
        "fuentes": [
            {"nombre": r.nombre, "disponible": r.confiable and AgentOrchestratorService.utc(r.created_at) >= cutoff,
             "motivo": parse_json_object(r.metadata_json).get("error"), "fecha": r.created_at.isoformat()}
            for r in latest_readings(db)
        ],
        "aforo_actual_pct": aforo_actual,
        "aforo_presentes": meta_aforo.get("presentes") if aforo_disponible else None,
        "aforo_capacidad": meta_aforo.get("capacidad_total") if aforo_disponible else None,
        "alertas_abiertas": len(alertas_abiertas),
        "alertas_criticas": criticas_count,
        "reglas_activas": reglas_activas_count,
        "agentes": [
            {
                "id": a.id,
                "tipo": a.tipo,
                "nombre": a.nombre,
                "activo": a.activo,
                "nivel_autonomia": a.nivel_autonomia_maximo
            }
            for a in agentes
        ],
        "metricas_validacion": {
            "precision_alertas_pct": None,
            "tasa_falsas_alarmas_pct": None,
            "latencia_media_segundos": round(latencia_media_ms / 1000, 2) if latencia_media_ms is not None else None,
            "acciones_sensibles_no_autorizadas": acciones_sensibles_no_autorizadas, # Objetivo 0
            "duplicados_indebidos": None,
            "total_alertas_historicas": total_alertas,
            "alertas_resueltas": alertas_resueltas
        }
    }

# 3. Listado de Alertas
@router.get("/alertas")
def list_alertas(
    estado: Optional[str] = None,
    agente_tipo: Optional[str] = None,
    severidad: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    AgentOrchestratorService.seed_initial_config_if_empty(db)
    query = db.query(AlertaModel)

    if estado:
        query = query.filter(AlertaModel.estado == estado)
    if agente_tipo:
        query = query.filter(AlertaModel.agente_tipo == agente_tipo)
    if severidad:
        query = query.filter(AlertaModel.severidad == severidad)

    alertas = query.order_by(desc(AlertaModel.updated_at)).limit(limit).all()

    return [
        {
            "id": a.id,
            "regla_id": a.regla_id,
            "agente_tipo": a.agente_tipo,
            "sede_id": a.sede_id,
            "titulo": a.titulo,
            "severidad": a.severidad,
            "estado": a.estado,
            "valor_observado": a.valor_observado,
            "valor_referencia": a.valor_referencia,
            "condicion_activadora": a.condicion_activadora,
            "explicacion": a.explicacion,
            "recomendacion": a.recomendacion,
            "origen_explicacion": a.origen_explicacion,
            "modelo_ia_browser": a.modelo_ia_browser,
            "grado_confianza": a.grado_confianza,
            "contador_ocurrencias": a.contador_ocurrencias,
            "responsable": a.responsable,
            "evidencia": parse_json_object(a.evidencia_json),
            "evidencia_hash": evidence_hash(a),
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
        }
        for a in alertas
    ]

# 4. Detalle de Alerta
@router.get("/alertas/{alerta_id}")
def get_alerta_detail(alerta_id: str, db: Session = Depends(get_db)):
    alerta = db.query(AlertaModel).filter_by(id=alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    acciones = db.query(AccionAgenteModel).filter_by(alerta_id=alerta_id).all()
    decisiones = db.query(HistorialDecisionModel).filter_by(alerta_id=alerta_id).all()

    return {
        "alerta": {
            "id": alerta.id,
            "regla_id": alerta.regla_id,
            "agente_tipo": alerta.agente_tipo,
            "sede_id": alerta.sede_id,
            "titulo": alerta.titulo,
            "severidad": alerta.severidad,
            "estado": alerta.estado,
            "valor_observado": alerta.valor_observado,
            "valor_referencia": alerta.valor_referencia,
            "condicion_activadora": alerta.condicion_activadora,
            "explicacion": alerta.explicacion,
            "recomendacion": alerta.recomendacion,
            "origen_explicacion": alerta.origen_explicacion,
            "modelo_ia_browser": alerta.modelo_ia_browser,
            "grado_confianza": alerta.grado_confianza,
            "contador_ocurrencias": alerta.contador_ocurrencias,
            "responsable": alerta.responsable,
            "evidencia": parse_json_object(alerta.evidencia_json),
            "evidencia_hash": evidence_hash(alerta),
            "created_at": alerta.created_at.isoformat() if alerta.created_at else None,
            "updated_at": alerta.updated_at.isoformat() if alerta.updated_at else None,
            "resolved_at": alerta.resolved_at.isoformat() if alerta.resolved_at else None,
        },
        "acciones": [
            {
                "id": ac.id,
                "tipo_accion": ac.tipo_accion,
                "nivel_autonomia": ac.nivel_autonomia,
                "estado": ac.estado,
                "destinatario": ac.destinatario,
                "payload": parse_json_object(ac.payload_json),
                "aprobado_por": ac.aprobado_por,
                "created_at": ac.created_at.isoformat() if ac.created_at else None,
                "executed_at": ac.executed_at.isoformat() if ac.executed_at else None,
            }
            for ac in acciones
        ],
        "decisiones": [
            {
                "id": d.id,
                "que_observo": d.que_observo,
                "que_decidio": d.que_decidio,
                "por_que_decidio": d.por_que_decidio,
                "nivel_autonomia": d.nivel_autonomia,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in decisiones
        ]
    }

# 5. Cambiar Estado de Alerta (Administrador)
@router.patch("/alertas/{alerta_id}/estado")
def update_alerta_estado(
    alerta_id: str,
    dto: ActualizarEstadoAlertaDTO,
    db: Session = Depends(get_db)
):
    alerta = db.query(AlertaModel).filter_by(id=alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    alerta.estado = dto.estado.value
    if dto.responsable:
        alerta.responsable = dto.responsable
    if dto.estado == EstadoAlerta.RESUELTA.value:
        alerta.resolved_at = datetime.now(timezone.utc)
    else:
        alerta.resolved_at = None
    alerta.updated_at = datetime.now(timezone.utc)

    # Registrar en historial
    db.add(HistorialDecisionModel(
        id=f"DEC-{uuid.uuid4().hex[:8].upper()}",
        ejecucion_id="ADMIN-ACTION",
        agente_tipo=alerta.agente_tipo,
        sede_id=alerta.sede_id,
        alerta_id=alerta.id,
        que_observo=f"Actualización manual de estado por administrador a {dto.estado}",
        que_decidio=f"Estado cambiado a {dto.estado}. Responsable: {dto.responsable or 'No especificado'}",
        por_que_decidio=dto.motivo or "Intervención operativa directa en el Centro de Monitoreo.",
        nivel_autonomia=NivelAutonomia.AUTOMATIZACION_CONTROLADA.value
    ))

    db.commit()
    return {"message": "Estado de alerta actualizado exitosamente", "alerta_id": alerta.id, "estado": alerta.estado}

# 6. Sincronización de Explicación generada por la IA Local del Navegador
@router.post("/evaluaciones/ejecutar")
async def execute_evaluation_cycle(
    dto: EjecutarCicloDTO,
    db: Session = Depends(get_db)
):
    return await AgentOrchestratorService.ejecutar_ciclo_completo(
        db=db, tipo_ejecucion=TipoEjecucion(dto.tipo_ejecucion)
    )

# 9. Gestión de Reglas
@router.get("/reglas")
def list_reglas(db: Session = Depends(get_db)):
    AgentOrchestratorService.seed_initial_config_if_empty(db)
    reglas = db.query(ReglaMonitoreoModel).all()
    return [
        {
            "id": r.id,
            "agente_tipo": r.agente_tipo,
            "nombre": r.nombre,
            "indicador_clave": r.indicador_clave,
            "sede_id": r.sede_id,
            "umbral_preventivo": r.umbral_preventivo,
            "umbral_critico": r.umbral_critico,
            "umbral_cierre_histeresis": r.umbral_cierre_histeresis,
            "cooldown_seg": r.cooldown_seg,
            "duracion_minima_seg": r.duracion_minima_seg,
            "horario_inicio": r.horario_inicio,
            "horario_fin": r.horario_fin,
            "nivel_autonomia": r.nivel_autonomia,
            "activa": r.activa,
            "destinatarios": r.destinatarios
        }
        for r in reglas
    ]

@router.put("/reglas/{regla_id}", dependencies=[Depends(require_admin)])
def update_regla(
    regla_id: str,
    dto: ActualizarReglaDTO,
    db: Session = Depends(get_db)
):
    regla = db.query(ReglaMonitoreoModel).filter_by(id=regla_id).first()
    if not regla:
        raise HTTPException(status_code=404, detail="Regla no encontrada")

    upper = regla.agente_tipo in {"AFORO", "RETENCION", "SEGUIMIENTO"}
    if regla.agente_tipo == "COMERCIAL" and (dto.umbral_preventivo > 0 or dto.umbral_critico < -100):
        raise HTTPException(422, "La caída de matrículas debe estar entre -100 y 0 por ciento")
    if regla.agente_tipo in {"RETENCION", "OPERATIVO"} and not (0 <= dto.umbral_preventivo <= 100 and 0 <= dto.umbral_critico <= 100):
        raise HTTPException(422, "Los porcentajes deben estar entre 0 y 100")
    if regla.agente_tipo in {"AFORO", "SEGUIMIENTO"} and dto.umbral_preventivo <= 0:
        raise HTTPException(422, "El umbral preventivo debe ser positivo")
    if (upper and dto.umbral_critico <= dto.umbral_preventivo) or (not upper and dto.umbral_critico >= dto.umbral_preventivo):
        raise HTTPException(422, "El orden de los umbrales es incompatible con el indicador")
    if dto.umbral_cierre_histeresis is not None and ((upper and dto.umbral_cierre_histeresis >= dto.umbral_preventivo)
        or (not upper and dto.umbral_cierre_histeresis <= dto.umbral_preventivo)):
        raise HTTPException(422, "El umbral de cierre debe quedar fuera de la zona de alerta")

    regla.umbral_preventivo = dto.umbral_preventivo
    regla.umbral_critico = dto.umbral_critico
    regla.umbral_cierre_histeresis = dto.umbral_cierre_histeresis
    regla.cooldown_seg = dto.cooldown_seg
    regla.duracion_minima_seg = dto.duracion_minima_seg
    regla.horario_inicio = dto.horario_inicio
    regla.horario_fin = dto.horario_fin
    regla.anomalia_desde = None
    regla.nivel_autonomia = dto.nivel_autonomia
    regla.activa = dto.activa
    if dto.destinatarios is not None:
        regla.destinatarios = dto.destinatarios

    db.commit()
    return {"message": "Regla actualizada exitosamente", "regla_id": regla.id}

# 10. Autorización de Acciones Sensibles de Nivel 4 (Sección 8)
@router.post("/acciones/{accion_id}/autorizar", dependencies=[Depends(require_admin)])
def authorize_level_4_action(
    accion_id: str,
    dto: AutorizarAccionDTO,
    db: Session = Depends(get_db),
    x_actor_id: str = Header(default="")
):
    if not x_actor_id:
        raise HTTPException(401, "Falta la identidad del administrador autenticado")
    accion = db.query(AccionAgenteModel).filter_by(id=accion_id).with_for_update().first()
    if not accion:
        raise HTTPException(status_code=404, detail="Acción no encontrada")

    if accion.nivel_autonomia != 4 or accion.estado != EstadoAccion.PENDIENTE_APROBACION.value:
        raise HTTPException(409, "La acción no está pendiente de autorización de nivel 4")

    if dto.aprobado:
        accion.estado = EstadoAccion.APROBADA.value
        accion.aprobado_por = x_actor_id
        accion.executed_at = None
        accion.resultado = f"Propuesta aprobada por {x_actor_id}; pendiente de ejecución: {dto.comentario or 'Sin observaciones'}"
    else:
        accion.estado = EstadoAccion.RECHAZADA.value
        accion.aprobado_por = x_actor_id
        accion.resultado = f"Acción rechazada por {x_actor_id}: {dto.comentario or 'Rechazado'}"

    db.commit()
    return {
        "message": f"Acción de Nivel 4 {'aprobada' if dto.aprobado else 'rechazada'} exitosamente",
        "accion_id": accion.id,
        "nuevo_estado": accion.estado
    }

@router.post("/acciones/{accion_id}/ejecutar", dependencies=[Depends(require_admin)])
async def execute_approved_action(accion_id: str, db: Session = Depends(get_db)):
    action = db.query(AccionAgenteModel).filter_by(id=accion_id).with_for_update().first()
    if not action:
        raise HTTPException(404, "Acción no encontrada")
    if action.nivel_autonomia != 4 or not action.aprobado_por or action.estado != EstadoAccion.APROBADA.value:
        raise HTTPException(409, "Solo se pueden despachar propuestas aprobadas de nivel 4")
    alert = db.query(AlertaModel).filter_by(id=action.alerta_id).first()
    if not alert or alert.estado == EstadoAlerta.RESUELTA.value:
        raise HTTPException(409, "La alerta ya no requiere una acción operativa")
    rule = db.query(ReglaMonitoreoModel).filter_by(id=alert.regla_id).first() if alert else None
    if not rule or not rule.destinatarios:
        raise HTTPException(422, "Configura los destinatarios de la regla antes de despachar")
    payload = parse_json_object(action.payload_json)
    if payload.get("valor_observado") != alert.valor_observado or payload.get("evidencia") != parse_json_object(alert.evidencia_json):
        raise HTTPException(409, "La evidencia cambió; genera y revisa una nueva propuesta antes de despachar")
    action.payload_json = json.dumps({**payload, "accion_id": action.id,
        "aprobado_por": action.aprobado_por, "destinatarios": rule.destinatarios})
    action.estado = EstadoAccion.SOLICITADA.value
    db.commit()
    await AgentOrchestratorService.dispatch_pending_actions(db)
    return {"estado": action.estado, "resultado": action.resultado}

# 11. Ejecución de Herramientas para el Agente IA en el Navegador (Tool-Calling)
@router.post("/tools/execute")
async def execute_agent_tool(dto: ToolExecutionDTO):
    name = dto.tool_name
    params = dto.params or {}
    sede_id = params.get("sede_id", "SEDE-CENTRAL")

    if name == "obtener_aforo_actual":
        res = await GymToolsAdapter.obtener_aforo_actual(sede_id)
        return indicator_response(res)
    elif name == "obtener_asistencias":
        res = await GymToolsAdapter.obtener_asistencias(
            params.get("fecha_inicio", (datetime.now(timezone.utc).date() - timedelta(days=6)).isoformat()),
            params.get("fecha_fin", datetime.now(timezone.utc).date().isoformat()),
            sede_id
        )
        return indicator_response(res)
    elif name == "obtener_resumen_inscripciones":
        res = await GymToolsAdapter.obtener_resumen_inscripciones(
            params.get("periodo", "semanal"),
            sede_id
        )
        return indicator_response(res)
    elif name == "obtener_membresias_por_vencer":
        res = await GymToolsAdapter.obtener_membresias_por_vencer(
            params.get("dias", 15),
            sede_id
        )
        return indicator_response(res)
    elif name == "obtener_equipos_fuera_servicio":
        res = await GymToolsAdapter.obtener_equipos_fuera_servicio(sede_id)
        return indicator_response(res)
    elif name == "obtener_resumen_riesgo_abandono":
        res = await GymToolsAdapter.obtener_resumen_riesgo_abandono(sede_id)
        return indicator_response(res)
    else:
        raise HTTPException(status_code=400, detail=f"Herramienta desconocida: {name}")

# 12. Historial de Decisiones y Auditoría
@router.get("/historial")
def get_decision_history(limit: int = Query(default=50, ge=1, le=200), db: Session = Depends(get_db)):
    decisiones = (
        db.query(HistorialDecisionModel)
        .order_by(desc(HistorialDecisionModel.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": d.id,
            "ejecucion_id": d.ejecucion_id,
            "agente_tipo": d.agente_tipo,
            "sede_id": d.sede_id,
            "alerta_id": d.alerta_id,
            "que_observo": d.que_observo,
            "que_decidio": d.que_decidio,
            "por_que_decidio": d.por_que_decidio,
            "resultado_posterior": d.resultado_posterior,
            "nivel_autonomia": d.nivel_autonomia,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in decisiones
    ]

def indicator_response(indicator):
    data = indicator.model_dump(mode="json")
    if not indicator.confiable:
        data["valor_actual"] = None
    return data

