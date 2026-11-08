import json
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
        "destinatarios": ["operaciones@apexfitness.com", "recepcion@apexfitness.com"],
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
        "destinatarios": ["comercial@apexfitness.com", "gerencia@apexfitness.com"],
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
        "destinatarios": ["fidelizacion@apexfitness.com"],
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
        "destinatarios": ["mantenimiento@apexfitness.com"],
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
        "destinatarios": ["supervisor@apexfitness.com", "director@apexfitness.com"],
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

    @classmethod
    async def ejecutar_ciclo_completo(
        cls,
        db: Session,
        tipo_ejecucion: TipoEjecucion = TipoEjecucion.PERIODICO,
        sede_id: str = "SEDE-CENTRAL",
        override_indicadores: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Ejecuta el ciclo O-A-D-A-E para los 5 agentes especializados.
        override_indicadores permite forzar valores para simulaciones o pruebas controladas.
        """
        cls.seed_initial_config_if_empty(db)
        start_time = time.time()
        ejecucion_id = f"EXEC-{uuid.uuid4().hex[:8].upper()}"

        anomalias_detectadas = 0
        alertas_generadas = 0
        alertas_actualizadas = 0
        acciones_disparadas = 0

        # 1. OBSERVAR: Recolectar indicadores mediante herramientas autorizadas
        indicadores: List[IndicadorNegocio] = []
        is_simulation = (tipo_ejecucion == TipoEjecucion.SIMULACION)

        # Aforo
        if is_simulation and override_indicadores and "aforo_pct" in override_indicadores:
            aforo_val = override_indicadores["aforo_pct"]
            ind_aforo = IndicadorNegocio(
                nombre="Ocupación de Aforo",
                valor_actual=aforo_val,
                valor_referencia=75.0,
                unidad="%",
                sede_id=sede_id,
                servicio_origen="ms-gimnasio",
                confiable=True,
                metadata={"presentes": int(aforo_val), "capacidad_total": 100, "sede_id": sede_id}
            )
        else:
            ind_aforo = await GymToolsAdapter.obtener_aforo_actual(sede_id)
            if override_indicadores and "aforo_pct" in override_indicadores:
                ind_aforo.valor_actual = override_indicadores["aforo_pct"]
                cap = ind_aforo.metadata.get("capacidad_total", 100)
                ind_aforo.metadata["presentes"] = int((ind_aforo.valor_actual / 100) * cap)
        indicadores.append(ind_aforo)

        # Comercial (Matrículas)
        if is_simulation and override_indicadores and "matriculas_var_pct" in override_indicadores:
            mat_val = override_indicadores["matriculas_var_pct"]
            ind_comercial = IndicadorNegocio(
                nombre="Variación de Nuevas Matrículas",
                valor_actual=mat_val,
                valor_referencia=0.0,
                unidad="%",
                sede_id=sede_id,
                servicio_origen="ms-gimnasio",
                confiable=True,
                metadata={"matriculas_periodo_actual": 28, "matriculas_periodo_anterior": 40, "periodo": "semanal"}
            )
        else:
            ind_comercial = await GymToolsAdapter.obtener_resumen_inscripciones("semanal", sede_id)
            if override_indicadores and "matriculas_var_pct" in override_indicadores:
                ind_comercial.valor_actual = override_indicadores["matriculas_var_pct"]
        indicadores.append(ind_comercial)

        # Retención (ML Churn)
        if is_simulation and override_indicadores and "churn_alto_riesgo_pct" in override_indicadores:
            churn_val = override_indicadores["churn_alto_riesgo_pct"]
            ind_retencion = IndicadorNegocio(
                nombre="Proporción Clientes Alto Riesgo Abandono",
                valor_actual=churn_val,
                valor_referencia=12.0,
                unidad="%",
                sede_id=sede_id,
                servicio_origen="ms-machine-learning",
                confiable=True,
                metadata={"modelo": "RandomForestClassifier", "clientes_evaluados": 140, "umbral_score_riesgo": 0.70}
            )
        else:
            ind_retencion = await GymToolsAdapter.obtener_resumen_riesgo_abandono(sede_id)
            if override_indicadores and "churn_alto_riesgo_pct" in override_indicadores:
                ind_retencion.valor_actual = override_indicadores["churn_alto_riesgo_pct"]
        indicadores.append(ind_retencion)

        # Operativo (Equipos)
        if is_simulation and override_indicadores and "disponibilidad_equipos_pct" in override_indicadores:
            disp_val = override_indicadores["disponibilidad_equipos_pct"]
            ind_operativo = IndicadorNegocio(
                nombre="Disponibilidad de Equipos Críticos",
                valor_actual=disp_val,
                valor_referencia=100.0,
                unidad="%",
                sede_id=sede_id,
                servicio_origen="ms-inventario",
                confiable=True,
                metadata={"tipo_equipo": "Caminadoras / Cardio", "total_equipos": 5, "operativas": 2, "fuera_servicio": 3}
            )
        else:
            ind_operativo = await GymToolsAdapter.obtener_equipos_fuera_servicio(sede_id)
            if override_indicadores and "disponibilidad_equipos_pct" in override_indicadores:
                ind_operativo.valor_actual = override_indicadores["disponibilidad_equipos_pct"]
        indicadores.append(ind_operativo)

        # 2. ANALIZAR & DECIDIR: Evaluar contra reglas activas
        reglas_orm = db.query(ReglaMonitoreoModel).filter_by(activa=True).all()
        reglas_map = {r.agente_tipo: r for r in reglas_orm}

        alertas_procesadas = []

        for ind in indicadores:
            # Asociar indicador al tipo de agente correspondiente
            agente_tipo = None
            if ind.nombre == "Ocupación de Aforo":
                agente_tipo = TipoAgente.AFORO.value
            elif ind.nombre == "Variación de Nuevas Matrículas":
                agente_tipo = TipoAgente.COMERCIAL.value
            elif ind.nombre == "Proporción Clientes Alto Riesgo Abandono":
                agente_tipo = TipoAgente.RETENCION.value
            elif ind.nombre == "Disponibilidad de Equipos Críticos":
                agente_tipo = TipoAgente.OPERATIVO.value

            regla_orm = reglas_map.get(agente_tipo)
            if not regla_orm:
                continue

            regla = ReglaMonitoreo(
                id=regla_orm.id,
                agente_tipo=TipoAgente(regla_orm.agente_tipo),
                nombre=regla_orm.nombre,
                indicador_clave=regla_orm.indicador_clave,
                sede_id=regla_orm.sede_id,
                umbral_preventivo=regla_orm.umbral_preventivo,
                umbral_critico=regla_orm.umbral_critico,
                umbral_cierre_histeresis=regla_orm.umbral_cierre_histeresis,
                cooldown_seg=regla_orm.cooldown_seg,
                nivel_autonomia=NivelAutonomia(regla_orm.nivel_autonomia),
                activa=regla_orm.activa,
                destinatarios=regla_orm.destinatarios
            )

            # Persistir lectura de indicador
            lectura_orm = LecturaIndicadorModel(
                id=f"LEC-{uuid.uuid4().hex[:8].upper()}",
                ejecucion_id=ejecucion_id,
                nombre=ind.nombre,
                valor_actual=ind.valor_actual,
                valor_referencia=ind.valor_referencia,
                unidad=ind.unidad,
                sede_id=ind.sede_id,
                servicio_origen=ind.servicio_origen,
                confiable=ind.confiable,
                metadata_json=json.dumps(ind.metadata)
            )
            db.add(lectura_orm)

            # Evaluar anomalía
            anomalia, condicion = RulesEngine.evaluar_indicador(regla, ind)

            # Consultar alerta abierta existente para deduplicación
            alerta_existente_orm = (
                db.query(AlertaModel)
                .filter(
                    AlertaModel.regla_id == regla.id,
                    AlertaModel.sede_id == regla.sede_id,
                    AlertaModel.estado.in_([
                        EstadoAlerta.DETECTADA.value,
                        EstadoAlerta.NOTIFICADA.value,
                        EstadoAlerta.EN_ATENCION.value,
                        EstadoAlerta.ESCALADA.value
                    ])
                )
                .first()
            )

            alerta_existente = None
            if alerta_existente_orm:
                alerta_existente = Alerta(
                    id=alerta_existente_orm.id,
                    regla_id=alerta_existente_orm.regla_id,
                    agente_tipo=TipoAgente(alerta_existente_orm.agente_tipo),
                    sede_id=alerta_existente_orm.sede_id,
                    titulo=alerta_existente_orm.titulo,
                    severidad=SeveridadAlerta(alerta_existente_orm.severidad),
                    estado=EstadoAlerta(alerta_existente_orm.estado),
                    valor_observado=alerta_existente_orm.valor_observado,
                    valor_referencia=alerta_existente_orm.valor_referencia,
                    condicion_activadora=alerta_existente_orm.condicion_activadora,
                    explicacion=alerta_existente_orm.explicacion,
                    recomendacion=alerta_existente_orm.recomendacion,
                    origen_explicacion=alerta_existente_orm.origen_explicacion,
                    modelo_ia_browser=alerta_existente_orm.modelo_ia_browser,
                    grado_confianza=alerta_existente_orm.grado_confianza,
                    contador_ocurrencias=alerta_existente_orm.contador_ocurrencias,
                    evidencia_json=json.loads(alerta_existente_orm.evidencia_json or "{}"),
                    created_at=alerta_existente_orm.created_at,
                    updated_at=alerta_existente_orm.updated_at
                )

            alerta_res, accion_tipo, accion_agente = RulesEngine.procesar_alerta_con_deduplicacion(
                regla, anomalia, ind, alerta_existente
            )

            if anomalia:
                anomalias_detectadas += 1
                anomalia_orm = AnomaliaModel(
                    id=anomalia.id,
                    regla_id=anomalia.regla_id,
                    agente_tipo=anomalia.agente_tipo.value,
                    sede_id=anomalia.sede_id,
                    indicador_clave=anomalia.indicador_clave,
                    valor_observado=anomalia.valor_observado,
                    valor_referencia=anomalia.valor_referencia,
                    severidad=anomalia.severidad.value,
                    grado_confianza=anomalia.grado_confianza,
                    descripcion=anomalia.descripcion,
                    metadata_json=json.dumps(anomalia.metadata)
                )
                db.add(anomalia_orm)

            # Persistir cambios de la alerta
            if alerta_res:
                if accion_tipo == "CREADA":
                    alertas_generadas += 1
                    nuevo_alerta_orm = AlertaModel(
                        id=alerta_res.id,
                        regla_id=alerta_res.regla_id,
                        agente_tipo=alerta_res.agente_tipo.value,
                        sede_id=alerta_res.sede_id,
                        titulo=alerta_res.titulo,
                        severidad=alerta_res.severidad.value,
                        estado=alerta_res.estado.value,
                        valor_observado=alerta_res.valor_observado,
                        valor_referencia=alerta_res.valor_referencia,
                        condicion_activadora=alerta_res.condicion_activadora,
                        explicacion=alerta_res.explicacion,
                        recomendacion=alerta_res.recomendacion,
                        origen_explicacion=alerta_res.origen_explicacion,
                        grado_confianza=alerta_res.grado_confianza,
                        contador_ocurrencias=alerta_res.contador_ocurrencias,
                        evidencia_json=json.dumps(alerta_res.evidencia_json)
                    )
                    db.add(nuevo_alerta_orm)
                elif accion_tipo in ["ESCALADA", "COOLDOWN_IGNORADA", "ACTUALIZADA_POST_COOLDOWN", "RESUELTA_POR_HISTERESIS"]:
                    if accion_tipo == "ESCALADA":
                        alertas_actualizadas += 1
                    alerta_existente_orm.severidad = alerta_res.severidad.value
                    alerta_existente_orm.estado = alerta_res.estado.value
                    alerta_existente_orm.valor_observado = alerta_res.valor_observado
                    alerta_existente_orm.contador_ocurrencias = alerta_res.contador_ocurrencias
                    alerta_existente_orm.explicacion = alerta_res.explicacion
                    alerta_existente_orm.recomendacion = alerta_res.recomendacion
                    alerta_existente_orm.evidencia_json = json.dumps(alerta_res.evidencia_json)
                    alerta_existente_orm.updated_at = datetime.now(timezone.utc)
                    if alerta_res.resolved_at:
                        alerta_existente_orm.resolved_at = datetime.now(timezone.utc)

                alertas_procesadas.append({
                    "id": alerta_res.id,
                    "titulo": alerta_res.titulo,
                    "severidad": alerta_res.severidad.value,
                    "accion_tipo": accion_tipo,
                    "valor_observado": alerta_res.valor_observado
                })

                # 3. ACTUAR: Despachar acción si aplica según autonomía
                if accion_agente:
                    acciones_disparadas += 1
                    accion_orm = AccionAgenteModel(
                        id=accion_agente.id,
                        alerta_id=accion_agente.alerta_id,
                        tipo_accion=accion_agente.tipo_accion,
                        nivel_autonomia=accion_agente.nivel_autonomia.value,
                        estado=accion_agente.estado.value,
                        destinatario=accion_agente.destinatario,
                        payload_json=json.dumps(accion_agente.payload)
                    )
                    db.add(accion_orm)

                    if accion_agente.nivel_autonomia == NivelAutonomia.AUTOMATIZACION_CONTROLADA:
                        # Disparar webhook n8n solo en ejecuciones reales
                        if not is_simulation:
                            await GymToolsAdapter.solicitar_notificacion(
                                alerta_res.id,
                                regla.destinatarios,
                                accion_agente.payload
                            )
                        accion_orm.estado = EstadoAccion.EJECUTADA.value
                        accion_orm.executed_at = datetime.now(timezone.utc)

                # Registrar auditoría de decisión
                historial_orm = HistorialDecisionModel(
                    id=f"DEC-{uuid.uuid4().hex[:8].upper()}",
                    ejecucion_id=ejecucion_id,
                    agente_tipo=regla.agente_tipo.value,
                    sede_id=regla.sede_id,
                    alerta_id=alerta_res.id,
                    que_observo=f"{ind.nombre}: {ind.valor_actual}{ind.unidad} (Ref: {ind.valor_referencia or 'N/A'})",
                    que_decidio=f"Acción {accion_tipo} con severidad {alerta_res.severidad.value}",
                    por_que_decidio=f"Regla {regla.id} evaluada ({regla.indicador_clave}). Autonomía Nivel {regla.nivel_autonomia.value}.",
                    nivel_autonomia=regla.nivel_autonomia.value
                )
                db.add(historial_orm)

        # 4. AGENTE DE SEGUIMIENTO: Supervisar SLA de alertas abiertas
        alertas_abiertas = (
            db.query(AlertaModel)
            .filter(AlertaModel.estado.in_([EstadoAlerta.DETECTADA.value, EstadoAlerta.NOTIFICADA.value]))
            .all()
        )
        now_utc = datetime.now(timezone.utc)
        for ab in alertas_abiertas:
            created = ab.created_at.replace(tzinfo=timezone.utc if ab.created_at.tzinfo is None else ab.created_at.tzinfo)
            mins_abierta = (now_utc - created).total_seconds() / 60.0
            if mins_abierta >= 30.0 and ab.estado != EstadoAlerta.ESCALADA.value:
                ab.estado = EstadoAlerta.ESCALADA.value
                ab.severidad = SeveridadAlerta.CRITICA.value
                ab.explicacion += f" | ESCALAMIENTO POR SEGUIMIENTO: Alerta abierta durante {round(mins_abierta, 1)} minutos sin atención."
                ab.updated_at = now_utc
                alertas_actualizadas += 1

                # Auditoría de seguimiento
                db.add(HistorialDecisionModel(
                    id=f"DEC-{uuid.uuid4().hex[:8].upper()}",
                    ejecucion_id=ejecucion_id,
                    agente_tipo=TipoAgente.SEGUIMIENTO.value,
                    sede_id=ab.sede_id,
                    alerta_id=ab.id,
                    que_observo=f"Alerta {ab.id} abierta por {round(mins_abierta, 1)} min sin resolución",
                    que_decidio="Escalar alerta a CRITICA por vencimiento de SLA",
                    por_que_decidio="Agente de seguimiento verificó inactividad superior a 30 minutos.",
                    nivel_autonomia=NivelAutonomia.AUTOMATIZACION_CONTROLADA.value
                ))

        # Registrar ejecución del ciclo
        latencia_ms = round((time.time() - start_time) * 1000, 2)
        ejecucion_orm = EjecucionAgenteModel(
            id=ejecucion_id,
            agente_tipo="SISTEMA_MULTIAGENTE_GLOBAL",
            tipo_ejecucion=tipo_ejecucion.value,
            anomalias_detectadas=anomalias_detectadas,
            alertas_generadas=alertas_generadas,
            alertas_actualizadas=alertas_actualizadas,
            acciones_disparadas=acciones_disparadas,
            latencia_ms=latencia_ms,
            completado=True
        )
        db.add(ejecucion_orm)

        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error al commitear ejecución: {e}")

        return {
            "ejecucion_id": ejecucion_id,
            "anomalias_detectadas": anomalias_detectadas,
            "alertas_generadas": alertas_generadas,
            "alertas_actualizadas": alertas_actualizadas,
            "acciones_disparadas": acciones_disparadas,
            "latencia_ms": latencia_ms,
            "alertas_procesadas": alertas_procesadas,
            "indicadores_evaluados": len(indicadores)
        }
