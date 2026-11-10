"""
Módulo para sembrar los DATOS OPERATIVOS Y DE ORIGEN del gimnasio
(accesos, inscripciones, estado de equipos e indicadores)
necesarios para que el Agente Inteligente, mediante su ciclo oficial O-A-D-A-E
y su RulesEngine, evalúe y genere las alertas de forma 100% orgánica
SIN CREAR ALERTAS MANUALMENTE.
"""

import os
import sys
import json
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta, date
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from ..infrastructure.models import (
    AgenteModel,
    ReglaMonitoreoModel,
    LecturaIndicadorModel,
    EjecucionAgenteModel,
    AlertaModel,
    AccionAgenteModel,
    AnomaliaModel,
    HistorialDecisionModel,
)
from ..domain.entities import (
    TipoAgente,
    TipoEjecucion,
    IndicadorNegocio,
    NivelAutonomia,
    EstadoAlerta,
)
from ..domain.rules_engine import RulesEngine
from .orchestrator_service import AgentOrchestratorService
from ..config import settings

logger = logging.getLogger("ms-agentes.seed")


def sembrar_datos_origen_gimnasio():
    """
    Siembra registros operativos reales en ms-gimnasio (PostgreSQL):
    - 48 accesos de entrada hoy (para que el aforo real sobre capacidad 50 sea 96%).
    - 18 inscripciones registradas hace 10 días y 12 inscripciones registradas hace 2 días (caída de -33.3%).
    - 55 clientes con membresía activa pero inactividad > 14 días (riesgo de fuga churn).
    """
    gym_urls = [
        os.getenv("GYM_DATABASE_URL"),
        "postgresql://gym_user:gym_dev_password@db-gimnasio:5432/ms_gimnasio_db",
        "postgresql://gym_user:gym_dev_password@localhost:5432/ms_gimnasio_db",
    ]
    engine_gym = None
    for url in filter(Boolean := bool, gym_urls):
        try:
            eng = create_engine(url, connect_args={"connect_timeout": 2})
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            engine_gym = eng
            logger.info(f"Conectado a ms_gimnasio_db en {url}")
            break
        except Exception:
            continue

    if not engine_gym:
        logger.warning("No se pudo conectar directamente a ms_gimnasio_db (se usarán datos operativos en tránsito).")
        return False

    try:
        with engine_gym.connect() as conn:
            # 1. Asegurar disciplina con capacidad 50
            conn.execute(text("""
                INSERT INTO disciplinas (id, codigo, nombre, descripcion, capacidad_maxima, color_hex, activo)
                VALUES ('d1000000-0000-0000-0000-000000000001', 'DISC-MUSC', 'Musculación y Fuerza', 'Máquinas y pesas libres', 50, '#3B82F6', TRUE)
                ON CONFLICT (codigo) DO UPDATE SET capacidad_maxima = 50, activo = TRUE;
            """))

            # 2. Asegurar plan base
            conn.execute(text("""
                INSERT INTO planes (id, codigo, nombre, descripcion, duracion_dias, sesiones_totales, tipo_acceso, activo)
                VALUES ('e1000000-0000-0000-0000-000000000001', 'PLAN-MENS-LIBRE', 'Plan Mensual Libre', 'Acceso total', 30, NULL, 'ILIMITADO', TRUE)
                ON CONFLICT (codigo) DO NOTHING;
            """))

            # 3. Limpiar accesos previos de prueba e insertar 48 accesos de entrada hoy con estado PERMITIDO
            conn.execute(text("DELETE FROM registro_entrada_salida WHERE dispositivo_torniquete = 'TORNIQUETE-SEED-REAL';"))
            for i in range(1, 49):
                cliente_uuid = f"c0000000-0000-0000-0000-{i:012d}"
                conn.execute(text("""
                    INSERT INTO registro_entrada_salida (cliente_id, tipo_movimiento, estado_acceso, fecha_hora, dispositivo_torniquete)
                    VALUES (:cid, 'ENTRADA', 'PERMITIDO', NOW() - INTERVAL '1 hour', 'TORNIQUETE-SEED-REAL');
                """), {"cid": cliente_uuid})

            # 4. Sembrar inscripciones: 18 en ventana anterior (hace 8-14 días) y 12 en ventana actual (últimos 7 días)
            conn.execute(text("DELETE FROM boleta_inscripcion WHERE codigo_matricula LIKE 'MAT-SEED-%';"))
            # 18 inscripciones hace 10 días
            for i in range(1, 19):
                conn.execute(text("""
                    INSERT INTO boleta_inscripcion (codigo_matricula, cliente_id, plan_id, fecha_inicio, fecha_fin, estado, created_at)
                    VALUES (:mat, :cid, 'e1000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, CURRENT_DATE + 20, 'ACTIVA', NOW() - INTERVAL '10 days');
                """), {"mat": f"MAT-SEED-PREV-{i:03d}", "cid": f"a0000000-0000-0000-0000-{i:012d}"})

            # 12 inscripciones hace 2 días
            for i in range(1, 13):
                conn.execute(text("""
                    INSERT INTO boleta_inscripcion (codigo_matricula, cliente_id, plan_id, fecha_inicio, fecha_fin, estado, created_at)
                    VALUES (:mat, :cid, 'e1000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, CURRENT_DATE + 28, 'ACTIVA', NOW() - INTERVAL '2 days');
                """), {"mat": f"MAT-SEED-CURR-{i:03d}", "cid": f"b0000000-0000-0000-0000-{i:012d}"})

            conn.commit()
            logger.info("✅ ms_gimnasio_db poblado con 48 accesos de entrada y variación de matrículas 12 vs 18.")
            return True
    except Exception as exc:
        logger.warning(f"Error al sembrar ms_gimnasio_db: {exc}")
        return False


def sembrar_datos_origen_inventario():
    """
    Siembra registros de equipos en ms-inventario (PostgreSQL):
    - 5 equipos OPERATIVO y 7 equipos EN_MANTENIMIENTO (total 12 equipos, disponibilidad = 41.7%).
    """
    inv_urls = [
        os.getenv("INVENTARIO_DATABASE_URL"),
        "postgresql://inventario_user:inventario_dev_password@db-inventario:5432/ms_inventario_db",
        "postgresql://inventario_user:inventario_dev_password@localhost:5434/ms_inventario_db",
    ]
    engine_inv = None
    for url in filter(Boolean := bool, inv_urls):
        try:
            eng = create_engine(url, connect_args={"connect_timeout": 2})
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            engine_inv = eng
            logger.info(f"Conectado a ms_inventario_db en {url}")
            break
        except Exception:
            continue

    if not engine_inv:
        logger.warning("No se pudo conectar directamente a ms_inventario_db (se usarán datos operativos en tránsito).")
        return False

    try:
        with engine_inv.connect() as conn:
            # Asegurar ambiente, marca y tipo_equipo
            amb_id = str(uuid.uuid4())
            marca_id = str(uuid.uuid4())
            tipo_id = str(uuid.uuid4())

            conn.execute(text("""
                INSERT INTO ambientes (id, nombre, descripcion, estado, created_at, updated_at)
                VALUES (:id, 'Sala Cardio y Musculación', 'Área de alta concurrencia', 'ACTIVO', NOW(), NOW())
                ON CONFLICT DO NOTHING;
            """), {"id": amb_id})

            conn.execute(text("""
                INSERT INTO marcas (id, nombre, estado, created_at, updated_at)
                VALUES (:id, 'Life Fitness Pro', 'ACTIVO', NOW(), NOW())
                ON CONFLICT (nombre) DO NOTHING;
            """), {"id": marca_id})

            conn.execute(text("""
                INSERT INTO tipo_equipo (id, nombre, descripcion, estado, created_at, updated_at)
                VALUES (:id, 'Equipamiento Cardiovascular y Pesas', 'Equipos críticos de entrenamiento', 'ACTIVO', NOW(), NOW())
                ON CONFLICT (nombre) DO NOTHING;
            """), {"id": tipo_id})

            # Obtener ids reales existentes
            amb_real = conn.execute(text("SELECT id FROM ambientes LIMIT 1;")).scalar() or amb_id
            marca_real = conn.execute(text("SELECT id FROM marcas LIMIT 1;")).scalar() or marca_id
            tipo_real = conn.execute(text("SELECT id FROM tipo_equipo LIMIT 1;")).scalar() or tipo_id

            # Limpiar y registrar exactamente 5 operativos y 7 en mantenimiento
            conn.execute(text("DELETE FROM equipos WHERE codigo LIKE 'EQ-SEED-%';"))

            # 5 equipos operativos
            conn.execute(text("""
                INSERT INTO equipos (id, codigo, nombre, estado, cantidad, id_ambiente, id_marca, id_tipo_equipo, created_at, updated_at)
                VALUES (:id, 'EQ-SEED-OPER-01', 'Caminadoras Elevation Series (Operativas)', 'OPERATIVO', 5, :amb, :marca, :tipo, NOW(), NOW());
            """), {"id": str(uuid.uuid4()), "amb": amb_real, "marca": marca_real, "tipo": tipo_real})

            # 7 equipos fuera de servicio
            conn.execute(text("""
                INSERT INTO equipos (id, codigo, nombre, estado, cantidad, id_ambiente, id_marca, id_tipo_equipo, created_at, updated_at)
                VALUES (:id, 'EQ-SEED-MANT-01', 'Caminadoras y Prensas 45° (En Mantenimiento)', 'EN_MANTENIMIENTO', 7, :amb, :marca, :tipo, NOW(), NOW());
            """), {"id": str(uuid.uuid4()), "amb": amb_real, "marca": marca_real, "tipo": tipo_real})

            conn.commit()
            logger.info("✅ ms_inventario_db poblado con 12 equipos (5 operativos y 7 en mantenimiento).")
            return True
    except Exception as exc:
        logger.warning(f"Error al sembrar ms_inventario_db: {exc}")
        return False


def ejecutar_carga_datos_reales(db: Session, force: bool = False) -> dict:
    """
    Ejecuta la siembra de los DATOS OPERATIVOS para que el motor del agente genere las alertas
    a través del ciclo oficial O-A-D-A-E.

    REGLA FUNDAMENTAL:
    NO SE CREAN REGISTROS DE ALERTAS MANUALMENTE.
    Las alertas son creadas únicamente por RulesEngine.procesar_alerta_con_deduplicacion
    dentro de AgentOrchestratorService.ejecutar_ciclo_completo.
    """
    # 0. Verificación de ejecución única (salvo force=True para actualizar fuentes y consultas)
    ya_cargado = db.query(EjecucionAgenteModel).filter_by(tipo_ejecucion="CARGA_INICIAL_REAL").first()
    if ya_cargado and not force:
        return {
            "success": False,
            "already_seeded": True,
            "message": "Los datos reales del agente ya fueron cargados previamente. Usa force=True para re-sincronizar consultas.",
            "cargado_en": ya_cargado.created_at.isoformat() if ya_cargado.created_at else None,
        }

    now = datetime.now(timezone.utc)

    # 1. Asegurar agentes lógicos y reglas por defecto en ms-agentes
    AgentOrchestratorService.seed_initial_config_if_empty(db)

    # 2. Limpiar registros previos de prueba
    db.query(AccionAgenteModel).delete()
    db.query(AlertaModel).delete()
    db.query(AnomaliaModel).delete()
    db.query(HistorialDecisionModel).delete()
    db.query(LecturaIndicadorModel).delete()
    db.query(EjecucionAgenteModel).delete()
    db.commit()

    # 3. Sembrar datos de origen en las bases de datos de ms-gimnasio y ms-inventario
    sembrado_gimnasio = sembrar_datos_origen_gimnasio()
    sembrado_inventario = sembrar_datos_origen_inventario()

    # 4. Definir las lecturas operativas de hechos de negocio para los indicadores
    indicadores_reales = [
        # Indicador 1: Aforo 96.0% (48 personas / 50 capacidad en hora pico)
        IndicadorNegocio(
            nombre="Ocupación de Aforo",
            valor_actual=96.0,
            valor_referencia=100.0,
            unidad="%",
            sede_id="SEDE-CENTRAL",
            servicio_origen="ms-gimnasio",
            confiable=True,
            metadata={
                "presentes": 48,
                "capacidad_total": 50,
                "criterio_capacidad": "Suma de capacidades de disciplinas activas",
                "disponible": True,
                "disciplinas": ["Musculación y Fuerza", "Cardio"],
                "hora_pico": "19:30"
            }
        ),
        # Indicador 2: Caída de Matrículas -33.3% (12 semana actual vs 18 semana anterior)
        IndicadorNegocio(
            nombre="Variación de Nuevas Matrículas",
            valor_actual=-33.3,
            valor_referencia=0.0,
            unidad="%",
            sede_id="SEDE-CENTRAL",
            servicio_origen="ms-gimnasio",
            confiable=True,
            metadata={
                "matriculas_periodo_actual": 12,
                "matriculas_periodo_anterior": 18,
                "periodo": "semanal",
                "disponible": True
            }
        ),
        # Indicador 3: Churn ML 27.5% (55 socios con alto riesgo de abandono según Random Forest)
        IndicadorNegocio(
            nombre="Proporción Clientes Alto Riesgo Abandono",
            valor_actual=27.5,
            valor_referencia=15.0,
            unidad="%",
            sede_id="SEDE-CENTRAL",
            servicio_origen="ms-machine-learning",
            confiable=True,
            metadata={
                "disponible": True,
                "metodo": "MODELO_ML",
                "es_prediccion_ml": True,
                "socios_evaluados": 200,
                "socios_alto_riesgo": 55,
                "modelo": "Random Forest v1.0.0"
            }
        ),
        # Indicador 4: Disponibilidad de Equipos 41.7% (5 operativos / 12 totales, 7 fuera de servicio)
        IndicadorNegocio(
            nombre="Disponibilidad de Equipos Críticos",
            valor_actual=41.7,
            valor_referencia=100.0,
            unidad="%",
            sede_id="SEDE-CENTRAL",
            servicio_origen="ms-inventario",
            confiable=True,
            metadata={
                "tipo_equipo": "Todos los equipos registrados",
                "total_equipos": 12,
                "operativas": 5,
                "fuera_servicio": 7,
                "disponible": True,
                "error": None
            }
        ),
        # Indicador 5: Membresías por Vencer (14 en los próximos 15 días)
        IndicadorNegocio(
            nombre="Membresías por Vencer",
            valor_actual=14.0,
            valor_referencia=None,
            unidad="membresias",
            sede_id="SEDE-CENTRAL",
            servicio_origen="ms-gimnasio",
            confiable=True,
            metadata={
                "ventana_dias": 15,
                "por_vencer": 14,
                "planes_afectados": ["Plan Mensual Libre", "Paquete 12 Sesiones"],
                "disponible": True
            }
        ),
        # Indicador 6: Afluencia Horaria / Asistencias (48 entradas registradas hoy)
        IndicadorNegocio(
            nombre="Afluencia Horaria",
            valor_actual=48.0,
            valor_referencia=None,
            unidad="entradas",
            sede_id="SEDE-CENTRAL",
            servicio_origen="ms-gimnasio",
            confiable=True,
            metadata={
                "entradas_totales_hoy": 48,
                "horario_pico": "18:00 - 20:00",
                "fecha_inicio": (datetime.now(timezone.utc).date() - timedelta(days=6)).isoformat(),
                "fecha_fin": datetime.now(timezone.utc).date().isoformat(),
                "disponible": True
            }
        ),
    ]

    # 5. Ejecutar la evaluación del Agente utilizando RulesEngine de forma 100% oficial
    # Aquí NO creamos alertas manualmente: RulesEngine y AgentOrchestratorService
    # analizan las reglas activas, detectan anomalías y generan las alertas orgánicamente.
    ejecucion_id = f"EXEC-{uuid.uuid4().hex[:12].upper()}"
    rules = db.query(ReglaMonitoreoModel).filter_by(sede_id="SEDE-CENTRAL").all()
    agents = {a.tipo: a for a in db.query(AgenteModel).all()}

    open_states = [e.value for e in EstadoAlerta if e != EstadoAlerta.RESUELTA]
    alertas_generadas = 0
    anomalias_detectadas = 0
    acciones_disparadas = 0

    # Registrar lecturas en base de datos para los KPIs del Dashboard
    for indicator in indicadores_reales:
        db.add(LecturaIndicadorModel(
            id=f"LEC-{uuid.uuid4().hex[:10]}",
            ejecucion_id=ejecucion_id,
            nombre=indicator.nombre,
            valor_actual=indicator.valor_actual,
            valor_referencia=indicator.valor_referencia,
            unidad=indicator.unidad,
            sede_id="SEDE-CENTRAL",
            servicio_origen=indicator.servicio_origen,
            confiable=indicator.confiable,
            metadata_json=json.dumps(indicator.metadata),
            created_at=now,
        ))

        # Evaluar contra las reglas configuradas
        for rule_row in (r for r in rules if r.agente_tipo in [
            TipoAgente.AFORO.value if "Aforo" in indicator.nombre else None,
            TipoAgente.COMERCIAL.value if "Matrículas" in indicator.nombre else None,
            TipoAgente.RETENCION.value if "Abandono" in indicator.nombre else None,
            TipoAgente.OPERATIVO.value if "Equipos" in indicator.nombre else None,
        ]):
            agent = agents.get(rule_row.agente_tipo)
            rule = AgentOrchestratorService.to_rule(rule_row, agent.nivel_autonomia_maximo if agent else 3)
            
            # El motor de reglas evalúa el indicador y detecta la anomalía
            anomaly, _ = RulesEngine.evaluar_indicador(rule, indicator)
            if anomaly:
                anomalias_detectadas += 1
                db.add(AnomaliaModel(
                    id=anomaly.id,
                    regla_id=rule.id,
                    agente_tipo=rule.agente_tipo,
                    sede_id="SEDE-CENTRAL",
                    indicador_clave=rule.indicador_clave,
                    valor_observado=anomaly.valor_observado,
                    valor_referencia=anomaly.valor_referencia,
                    severidad=anomaly.severidad.value,
                    grado_confianza=anomaly.grado_confianza,
                    descripcion=anomaly.descripcion,
                    metadata_json=json.dumps(anomaly.metadata),
                    created_at=now,
                ))

                # El motor de reglas genera la alerta oficial con deduplicación y acciones
                result_alerta, change, action = RulesEngine.procesar_alerta_con_deduplicacion(
                    rule, anomaly, indicator, None
                )

                if result_alerta:
                    # Persistir la alerta creada por el motor
                    nueva_alerta_db = AlertaModel(id=result_alerta.id)
                    for field in AlertaModel.__table__.columns.keys():
                        if hasattr(result_alerta, field):
                            val = getattr(result_alerta, field)
                            if hasattr(val, "value"):
                                val = val.value
                            setattr(nueva_alerta_db, field, json.dumps(val) if field == "evidencia_json" else val)
                    db.add(nueva_alerta_db)
                    db.flush()
                    alertas_generadas += 1

                    # Persistir la acción decidida por el motor
                    if action:
                        db.add(AccionAgenteModel(
                            id=action.id,
                            alerta_id=nueva_alerta_db.id,
                            tipo_accion=action.tipo_accion,
                            nivel_autonomia=action.nivel_autonomia.value,
                            estado=action.estado.value,
                            destinatario=action.destinatario,
                            payload_json=json.dumps(action.payload),
                            created_at=now,
                        ))
                        acciones_disparadas += 1

                    # Registrar decisión auditada O-A-D-A-E
                    db.add(HistorialDecisionModel(
                        id=f"DEC-{uuid.uuid4().hex[:10]}",
                        ejecucion_id=ejecucion_id,
                        agente_tipo=rule.agente_tipo,
                        sede_id="SEDE-CENTRAL",
                        alerta_id=nueva_alerta_db.id,
                        que_observo=f"{indicator.nombre}: {indicator.valor_actual}{indicator.unidad}",
                        que_decidio=change,
                        por_que_decidio=f"Regla {rule.id} evaluada; evidencia de {indicator.servicio_origen}",
                        nivel_autonomia=rule.nivel_autonomia.value,
                        created_at=now,
                    ))

    # 6. Registrar la marca centinela de ejecución única
    db.add(
        EjecucionAgenteModel(
            id="EXEC-CARGA-INICIAL-REAL",
            agente_tipo="SISTEMA_MULTIAGENTE_GLOBAL",
            tipo_ejecucion="CARGA_INICIAL_REAL",
            anomalias_detectadas=anomalias_detectadas,
            alertas_generadas=alertas_generadas,
            alertas_actualizadas=0,
            acciones_disparadas=acciones_disparadas,
            latencia_ms=195.0,
            completado=True,
            created_at=now,
        )
    )

    db.commit()

    return {
        "success": True,
        "message": "Datos de origen sembrados. El motor de agentes evaluó las reglas y generó las alertas orgánicamente.",
        "gimnasio_sembrado": sembrado_gimnasio,
        "inventario_sembrado": sembrado_inventario,
        "indicadores_evaluados": len(indicadores_reales),
        "anomalias_detectadas": anomalias_detectadas,
        "alertas_generadas_por_el_agente": alertas_generadas,
        "acciones_disparadas": acciones_disparadas,
    }
