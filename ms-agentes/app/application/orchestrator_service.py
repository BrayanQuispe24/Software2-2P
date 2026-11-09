import json
from ..infrastructure.json_data import parse_json_object
import uuid
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session

from ..domain.entities import (
    TipoAgente,
    SeveridadAlerta,
    EstadoAlerta,
    NivelAutonomia,
    EstadoAccion,
    TipoEjecucion,
    ReglaMonitoreo,
    IndicadorNegocio,
    Anomalia,
    Alerta,
    AccionAgente,
    HistorialDecision,
    EjecucionAgente,
)
from ..domain.rules_engine import RulesEngine
from ..infrastructure.models import (
    AgenteModel,
    ReglaMonitoreoModel,
    LecturaIndicadorModel,
    AnomaliaModel,
    AlertaModel,
    AccionAgenteModel,
    HistorialDecisionModel,
    EjecucionAgenteModel,
)
from ..infrastructure.tools.gym_tools import GymToolsAdapter

logger = logging.getLogger("ms-agentes.orchestrator")

DEFAULT_RULES = [
    {
        "id": "RULE-AFORO-01",
        "agente_tipo": TipoAgente.AFORO.value,
        "nombre": "Supervisión Preventiva y Crítica de Aforo",
        "indicador_clave": "OCUPACION_AFORO_PCT",
        "sede_id": "SEDE-CENTRAL",
        "umbral_preventivo": 90.0,
        "umbral_critico": 100.0,
        "umbral_cierre_histeresis": 85.0,
        "cooldown_seg": 300,
        "nivel_autonomia": NivelAutonomia.AUTOMATIZACION_CONTROLADA.value,
        "destinatarios": [],
    },
    {
        "id": "RULE-COMERCIAL-01",
        "agente_tipo": TipoAgente.COMERCIAL.value,
        "nombre": "Detección de Caída en Nuevas Matrículas",
        "indicador_clave": "VARIACION_MATRICULAS_PCT",
        "sede_id": "SEDE-CENTRAL",
        "umbral_preventivo": -20.0,
        "umbral_critico": -30.0,
        "umbral_cierre_histeresis": None,
        "cooldown_seg": 600,
        "nivel_autonomia": NivelAutonomia.AUTOMATIZACION_CONTROLADA.value,
        "destinatarios": [],
    },
    {
        "id": "RULE-RETENCION-01",
        "agente_tipo": TipoAgente.RETENCION.value,
        "nombre": "Alerta Temprana de Fuga de Clientes (ML Churn)",
        "indicador_clave": "CLIENTES_ALTO_RIESGO_PCT",
        "sede_id": "SEDE-CENTRAL",
        "umbral_preventivo": 20.0,
        "umbral_critico": 25.0,
        "umbral_cierre_histeresis": 15.0,
        "cooldown_seg": 600,
        "nivel_autonomia": NivelAutonomia.AUTOMATIZACION_CONTROLADA.value,
        "destinatarios": [],
    },
    {
        "id": "RULE-OPERATIVO-01",
        "agente_tipo": TipoAgente.OPERATIVO.value,
        "nombre": "Disponibilidad Mínima de Equipamiento Crítico",
        "indicador_clave": "DISPONIBILIDAD_EQUIPOS_PCT",
        "sede_id": "SEDE-CENTRAL",
        "umbral_preventivo": 60.0,
        "umbral_critico": 45.0,
        "umbral_cierre_histeresis": 80.0,
        "cooldown_seg": 300,
        "nivel_autonomia": NivelAutonomia.AUTOMATIZACION_CONTROLADA.value,
        "destinatarios": [],
    },
    {
        "id": "RULE-SEGUIMIENTO-01",
        "agente_tipo": TipoAgente.SEGUIMIENTO.value,
        "nombre": "SLA de Atención y Escalamiento de Alertas Críticas",
        "indicador_clave": "TIEMPO_ALERTA_ABIERTA_MIN",
        "sede_id": "SEDE-CENTRAL",
        "umbral_preventivo": 15.0,
        "umbral_critico": 30.0,
        "umbral_cierre_histeresis": None,
        "cooldown_seg": 300,
        "nivel_autonomia": NivelAutonomia.AUTOMATIZACION_CONTROLADA.value,
        "destinatarios": [],
    },
]

class AgentOrchestratorService:
    """
    Servicio orquestador del ciclo O-A-D-A-E (Observar, Analizar, Decidir, Actuar, Evaluar).
    Maneja persistencia, reglas de negocio y deduplicación.
    """

    @classmethod
    def seed_initial_config_if_empty(cls, db: Session):
        """Inicializa agentes lógicos y reglas por defecto si no existen."""
        agentes_def = [
            ("AGENTE_AFORO", TipoAgente.AFORO.value, "Agente de Aforo y Concurrencia", 3),
            ("AGENTE_COMERCIAL", TipoAgente.COMERCIAL.value, "Agente de Actividad Comercial", 3),
            ("AGENTE_RETENCION", TipoAgente.RETENCION.value, "Agente de Retención de Clientes (ML)", 3),
            ("AGENTE_OPERATIVO", TipoAgente.OPERATIVO.value, "Agente de Disponibilidad Operativa", 3),
            ("AGENTE_SEGUIMIENTO", TipoAgente.SEGUIMIENTO.value, "Agente de Seguimiento de Alertas", 3),
        ]

        for aid, tipo, nombre, nivel in agentes_def:
            if not db.query(AgenteModel).filter_by(tipo=tipo).first():
                agente = AgenteModel(
                    id=aid,
                    tipo=tipo,
                    nombre=nombre,
                    descripcion=f"Supervisor digital especializado en {nombre}.",
                    nivel_autonomia_maximo=nivel,
                    activo=True
                )
                db.add(agente)

        for r in DEFAULT_RULES:
            if not db.query(ReglaMonitoreoModel).filter_by(id=r["id"]).first():
                regla = ReglaMonitoreoModel(
                    id=r["id"],
                    agente_tipo=r["agente_tipo"],
                    nombre=r["nombre"],
                    indicador_clave=r["indicador_clave"],
                    sede_id=r["sede_id"],
                    umbral_preventivo=r["umbral_preventivo"],
                    umbral_critico=r["umbral_critico"],
                    umbral_cierre_histeresis=r.get("umbral_cierre_histeresis"),
                    cooldown_seg=r["cooldown_seg"],
                    nivel_autonomia=r["nivel_autonomia"],
                    activa=True,
                    destinatarios_json=json.dumps(r["destinatarios"])
                )
                db.add(regla)

        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"Error seeding config: {e}")
            raise

    @staticmethod
    def utc(value):
        return value.replace(tzinfo=value.tzinfo or timezone.utc).astimezone(timezone.utc)

    @staticmethod
    def regla_activa_ahora(regla, now):
        from zoneinfo import ZoneInfo
        from ..config import settings
        if not regla.activa:
            return False
        if not regla.horario_inicio or not regla.horario_fin:
            return True
        clock = now.astimezone(ZoneInfo(settings.MONITOR_TIMEZONE)).strftime("%H:%M")
        inicio, fin = regla.horario_inicio, regla.horario_fin
        return inicio <= clock < fin if inicio < fin else clock >= inicio or clock < fin

    @staticmethod
    def to_rule(row, maximo=4):
        return ReglaMonitoreo(
            id=row.id, agente_tipo=row.agente_tipo, nombre=row.nombre,
            indicador_clave=row.indicador_clave, sede_id=row.sede_id,
            umbral_preventivo=row.umbral_preventivo, umbral_critico=row.umbral_critico,
            umbral_cierre_histeresis=row.umbral_cierre_histeresis,
            duracion_minima_seg=row.duracion_minima_seg,
            horario_inicio=row.horario_inicio, horario_fin=row.horario_fin,
            cooldown_seg=row.cooldown_seg, nivel_autonomia=min(row.nivel_autonomia, maximo),
            activa=row.activa, destinatarios=row.destinatarios)

    @staticmethod
    def to_alert(row):
        fields = {name: getattr(row, name) for name in Alerta.model_fields if hasattr(row, name)}
        fields["evidencia_json"] = parse_json_object(row.evidencia_json)
        return Alerta(**fields)

    @classmethod
    async def persist_action(cls, db, regla, alerta, accion):
        if accion is None:
            return 0
        row = AccionAgenteModel(
            id=accion.id, alerta_id=alerta.id, tipo_accion=accion.tipo_accion,
            nivel_autonomia=accion.nivel_autonomia.value, estado=accion.estado.value,
            destinatario=accion.destinatario, payload_json=json.dumps(accion.payload))
        db.add(row)
        # Persist the intent before any external side effect. The action id is the idempotency key.
        db.flush()
        alerta.ultima_notificacion_at = datetime.now(timezone.utc)
        if accion.nivel_autonomia == NivelAutonomia.AUTOMATIZACION_CONTROLADA:
            row.payload_json = json.dumps({**accion.payload, "accion_id": accion.id,
                "destinatarios": regla.destinatarios})
        return 1

    @classmethod
    async def dispatch_pending_actions(cls, db):
        import asyncio
        pending = db.query(AccionAgenteModel).filter_by(estado=EstadoAccion.SOLICITADA.value).with_for_update(skip_locked=True).limit(20).all()
        async def deliver(action):
            if action.nivel_autonomia == 4 and not action.aprobado_por:
                action.estado = EstadoAccion.FALLIDA.value
                action.resultado = "Falta autorización humana"
                return
            payload = parse_json_object(action.payload_json)
            delivered = await GymToolsAdapter.solicitar_notificacion(action.alerta_id,
                payload.get("destinatarios", []), {**payload, "accion_id": action.id})
            action.estado = EstadoAccion.EJECUTADA.value if delivered else EstadoAccion.FALLIDA.value
            action.resultado = "Solicitud entregada al workflow; no confirma cambios en otros servicios" if delivered else "Webhook no disponible o destinatarios sin configurar"
            if delivered:
                action.executed_at = datetime.now(timezone.utc)
        await asyncio.gather(*(deliver(action) for action in pending))
        db.commit()

    @classmethod
    async def ejecutar_ciclo_completo(cls, db: Session, tipo_ejecucion=TipoEjecucion.PERIODICO,
                                     sede_id="SEDE-CENTRAL"):
        import asyncio
        from sqlalchemy import text
        from ..config import settings
        cls.seed_initial_config_if_empty(db)
        start = time.monotonic()
        now = datetime.now(timezone.utc)
        ejecucion_id = f"EXEC-{uuid.uuid4().hex[:12].upper()}"
        # Serialize periodic/manual cycles across workers, avoiding duplicate open alerts.
        if db.bind.dialect.name == "postgresql":
            db.execute(text("SELECT pg_advisory_xact_lock(8085001)"))
        rules = db.query(ReglaMonitoreoModel).filter_by(sede_id=sede_id).all()
        agents = {a.tipo: a for a in db.query(AgenteModel).all()}
        sources = [
            (TipoAgente.AFORO, GymToolsAdapter.obtener_aforo_actual(sede_id)),
            (TipoAgente.COMERCIAL, GymToolsAdapter.obtener_resumen_inscripciones("semanal", sede_id)),
            (TipoAgente.RETENCION, GymToolsAdapter.obtener_resumen_riesgo_abandono(sede_id)),
            (TipoAgente.OPERATIVO, GymToolsAdapter.obtener_equipos_fuera_servicio(sede_id)),
        ]
        readings = await asyncio.gather(*(call for _, call in sources))
        generated = updated = actions = anomalies = 0
        processed = []
        available = []
        open_states = [e.value for e in EstadoAlerta if e != EstadoAlerta.RESUELTA]
        for (kind, _), indicator in zip(sources, readings):
            age = (datetime.now(timezone.utc) - cls.utc(indicator.timestamp)).total_seconds()
            if age > settings.MAX_READING_AGE_SECONDS or age < -5:
                indicator.confiable = False
                indicator.metadata["error"] = "Lectura fuera de la ventana de vigencia"
            available.append({"agente": kind.value, "disponible": indicator.confiable,
                "motivo": indicator.metadata.get("error"), "servicio": indicator.servicio_origen})
            db.add(LecturaIndicadorModel(id=f"LEC-{uuid.uuid4().hex}", ejecucion_id=ejecucion_id,
                nombre=indicator.nombre, valor_actual=indicator.valor_actual,
                valor_referencia=indicator.valor_referencia, unidad=indicator.unidad,
                sede_id=sede_id, servicio_origen=indicator.servicio_origen,
                confiable=indicator.confiable, metadata_json=json.dumps(indicator.metadata)))
            for rule_row in (r for r in rules if r.agente_tipo == kind.value):
                agent = agents.get(kind.value)
                if not agent or not agent.activo or not cls.regla_activa_ahora(rule_row, now):
                    rule_row.anomalia_desde = None
                    continue
                rule = cls.to_rule(rule_row, agent.nivel_autonomia_maximo)
                anomaly, _ = RulesEngine.evaluar_indicador(rule, indicator)
                if not indicator.confiable or not anomaly:
                    rule_row.anomalia_desde = None
                elif rule_row.anomalia_desde is None:
                    rule_row.anomalia_desde = now
                if anomaly and (now - cls.utc(rule_row.anomalia_desde)).total_seconds() < rule.duracion_minima_seg:
                    continue
                existing = db.query(AlertaModel).filter(AlertaModel.regla_id == rule.id,
                    AlertaModel.sede_id == sede_id, AlertaModel.estado.in_(open_states)).first()
                if rule.nivel_autonomia == NivelAutonomia.OBSERVACION:
                    continue
                result, change, action = RulesEngine.procesar_alerta_con_deduplicacion(
                    rule, anomaly, indicator, cls.to_alert(existing) if existing else None)
                if anomaly:
                    anomalies += 1
                    db.add(AnomaliaModel(id=anomaly.id, regla_id=rule.id, agente_tipo=kind.value,
                        sede_id=sede_id, indicador_clave=rule.indicador_clave,
                        valor_observado=anomaly.valor_observado, valor_referencia=anomaly.valor_referencia,
                        severidad=anomaly.severidad.value, grado_confianza=anomaly.grado_confianza,
                        descripcion=anomaly.descripcion, metadata_json=json.dumps(anomaly.metadata)))
                if result is None:
                    continue
                if existing is None:
                    existing = AlertaModel(id=result.id)
                    db.add(existing)
                    generated += 1
                elif change != "COOLDOWN_IGNORADA":
                    updated += 1
                for field in Alerta.model_fields:
                    if hasattr(AlertaModel, field):
                        value = getattr(result, field)
                        if hasattr(value, "value"):
                            value = value.value
                        setattr(existing, field, json.dumps(value) if field == "evidencia_json" else value)
                actions += await cls.persist_action(db, rule, existing, action)
                processed.append({"id": result.id, "titulo": result.titulo,
                    "severidad": result.severidad.value, "accion_tipo": change,
                    "valor_observado": result.valor_observado})
                if change != "COOLDOWN_IGNORADA":
                    db.add(HistorialDecisionModel(id=f"DEC-{uuid.uuid4().hex}", ejecucion_id=ejecucion_id,
                        agente_tipo=kind.value, sede_id=sede_id, alerta_id=result.id,
                        que_observo=f"{indicator.nombre}: {indicator.valor_actual}{indicator.unidad}",
                        que_decidio=change, por_que_decidio=f"Regla {rule.id}; evidencia del servicio {indicator.servicio_origen}",
                        nivel_autonomia=rule.nivel_autonomia.value))
        db.flush()
        # Follow-up obeys its own rule and autonomy cap, including disabled rules and hours.
        for follow in (r for r in rules if r.agente_tipo == TipoAgente.SEGUIMIENTO.value):
            agent = agents.get(TipoAgente.SEGUIMIENTO.value)
            if not agent or not agent.activo or not cls.regla_activa_ahora(follow, now):
                continue
            rule = cls.to_rule(follow, agent.nivel_autonomia_maximo)
            if rule.nivel_autonomia == NivelAutonomia.OBSERVACION:
                continue
            candidates = db.query(AlertaModel).filter(AlertaModel.sede_id == sede_id,
                AlertaModel.estado.in_([EstadoAlerta.DETECTADA.value, EstadoAlerta.NOTIFICADA.value])).all()
            for alert in candidates:
                elapsed = (now - cls.utc(alert.created_at)).total_seconds()
                if elapsed < max(rule.umbral_preventivo * 60, rule.duracion_minima_seg):
                    continue
                evidence = parse_json_object(alert.evidencia_json)
                last = evidence.get("seguimiento_at")
                if last and (now - cls.utc(datetime.fromisoformat(last))).total_seconds() < rule.cooldown_seg:
                    continue
                critical = elapsed >= rule.umbral_critico * 60
                if critical:
                    alert.estado, alert.severidad = EstadoAlerta.ESCALADA.value, SeveridadAlerta.CRITICA.value
                evidence["seguimiento_at"] = now.isoformat()
                alert.evidencia_json = json.dumps(evidence)
                alert.updated_at = now
                db.add(HistorialDecisionModel(id=f"DEC-{uuid.uuid4().hex}", ejecucion_id=ejecucion_id,
                    agente_tipo=TipoAgente.SEGUIMIENTO.value, sede_id=sede_id, alerta_id=alert.id,
                    que_observo=f"Sin atención durante {elapsed/60:.1f} minutos",
                    que_decidio="ESCALADA_SLA" if critical else "AVISO_SLA",
                    por_que_decidio=f"Regla {follow.id}: {rule.umbral_preventivo}/{rule.umbral_critico} minutos",
                    nivel_autonomia=rule.nivel_autonomia.value))
                actions += await cls.persist_action(db, rule, alert, RulesEngine.determinar_accion(rule, cls.to_alert(alert)))
                updated += 1
        latency = round((time.monotonic()-start)*1000, 2)
        db.add(EjecucionAgenteModel(id=ejecucion_id, agente_tipo="SISTEMA_MULTIAGENTE_GLOBAL",
            tipo_ejecucion=tipo_ejecucion.value, anomalias_detectadas=anomalies,
            alertas_generadas=generated, alertas_actualizadas=updated, acciones_disparadas=actions,
            latencia_ms=latency, completado=True))
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise
        # Outbox: effects only after the facts, alert and intent have committed.
        await cls.dispatch_pending_actions(db)
        return {"ejecucion_id": ejecucion_id, "anomalias_detectadas": anomalies,
            "alertas_generadas": generated, "alertas_actualizadas": updated,
            "acciones_disparadas": actions, "latencia_ms": latency,
            "alertas_procesadas": processed, "indicadores_evaluados": len(readings),
            "fuentes": available}
