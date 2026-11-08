import pytest
import asyncio
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.infrastructure.db import Base
from app.domain.entities import (
    TipoAgente,
    SeveridadAlerta,
    EstadoAlerta,
    NivelAutonomia,
    EstadoAccion,
    TipoEjecucion,
    ReglaMonitoreo,
    IndicadorNegocio,
    Alerta,
)
from app.domain.rules_engine import RulesEngine
from app.application.orchestrator_service import AgentOrchestratorService
from app.infrastructure.models import (
    AlertaModel,
    AccionAgenteModel,
    HistorialDecisionModel,
)

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()
    AgentOrchestratorService.seed_initial_config_if_empty(db)
    yield db
    db.close()

def test_aforo_progression_escalation_and_hysteresis(test_db):
    """
    Valida el ciclo de aforo del documento:
    1. 92% de ocupación -> Crea Alerta PREVENTIVA.
    2. Sube a 100% -> Actualiza la MISMA alerta a CRITICA (Cero duplicados).
    3. Baja a 82% -> Cierra automáticamente la alerta por histéresis (< 85%).
    """
    async def run():
        # Paso 1: Ocupación al 92% (Umbral preventivo superado)
        res1 = await AgentOrchestratorService.ejecutar_ciclo_completo(
            db=test_db,
            tipo_ejecucion=TipoEjecucion.SIMULACION,
            override_indicadores={"aforo_pct": 92.0}
        )
        assert res1["alertas_generadas"] >= 1

        alertas_aforo = test_db.query(AlertaModel).filter_by(agente_tipo=TipoAgente.AFORO.value).all()
        assert len(alertas_aforo) == 1
        alerta_original = alertas_aforo[0]
        assert alerta_original.severidad == SeveridadAlerta.PREVENTIVA.value
        assert alerta_original.valor_observado == 92.0
        assert alerta_original.estado in [EstadoAlerta.DETECTADA.value, EstadoAlerta.NOTIFICADA.value]

        # Paso 2: Cinco minutos después sube a 100% de aforo
        res2 = await AgentOrchestratorService.ejecutar_ciclo_completo(
            db=test_db,
            tipo_ejecucion=TipoEjecucion.SIMULACION,
            override_indicadores={"aforo_pct": 100.0}
        )
        alertas_aforo_despues = test_db.query(AlertaModel).filter_by(agente_tipo=TipoAgente.AFORO.value).all()
        assert len(alertas_aforo_despues) == 1, "No deben crearse alertas duplicadas para la misma condición activa"
        
        alerta_escalada = alertas_aforo_despues[0]
        assert alerta_escalada.id == alerta_original.id
        assert alerta_escalada.severidad == SeveridadAlerta.CRITICA.value
        assert alerta_escalada.valor_observado == 100.0
        assert alerta_escalada.estado == EstadoAlerta.ESCALADA.value
        assert alerta_escalada.contador_ocurrencias >= 2

        # Paso 3: Baja a 82% (por debajo del umbral de histéresis del 85%)
        res3 = await AgentOrchestratorService.ejecutar_ciclo_completo(
            db=test_db,
            tipo_ejecucion=TipoEjecucion.SIMULACION,
            override_indicadores={"aforo_pct": 82.0}
        )
        alerta_final = test_db.query(AlertaModel).filter_by(id=alerta_original.id).first()
        assert alerta_final.estado == EstadoAlerta.RESUELTA.value
        assert "histéresis" in alerta_final.explicacion.lower()
        assert alerta_final.resolved_at is not None

    asyncio.run(run())

def test_commercial_and_ml_retention_correlation_scenario_15(test_db):
    """
    Valida el caso completo de la Sección 15:
    - Reducción del 25% en nuevas matrículas.
    - Aumento en proporción de clientes en alto riesgo de abandono (28.5% según ms-machine-learning).
    - El agente genera alertas fundamentadas con evidencia y recomendación sin afirmar falsa causalidad.
    """
    async def run():
        res = await AgentOrchestratorService.ejecutar_ciclo_completo(
            db=test_db,
            tipo_ejecucion=TipoEjecucion.SIMULACION,
            override_indicadores={
                "matriculas_var_pct": -25.0,
                "churn_alto_riesgo_pct": 28.5
            }
        )

        alerta_comercial = (
            test_db.query(AlertaModel)
            .filter_by(agente_tipo=TipoAgente.COMERCIAL.value)
            .order_by(AlertaModel.created_at.desc())
            .first()
        )
        assert alerta_comercial is not None
        assert alerta_comercial.valor_observado == -25.0
        assert "causa" in alerta_comercial.recomendacion.lower() or "campañas" in alerta_comercial.recomendacion.lower()

        alerta_retencion = (
            test_db.query(AlertaModel)
            .filter_by(agente_tipo=TipoAgente.RETENCION.value)
            .order_by(AlertaModel.created_at.desc())
            .first()
        )
        assert alerta_retencion is not None
        assert alerta_retencion.valor_observado == 28.5

    asyncio.run(run())

def test_operativo_equipment_availability(test_db):
    """
    Valida el caso de disponibilidad operativa (3 de 5 caminadoras fuera de servicio = 40% disponibilidad).
    Dispara alerta Crítica al caer por debajo del umbral del 45%.
    """
    async def run():
        res = await AgentOrchestratorService.ejecutar_ciclo_completo(
            db=test_db,
            tipo_ejecucion=TipoEjecucion.SIMULACION,
            override_indicadores={"disponibilidad_equipos_pct": 40.0}
        )

        alerta_operativa = (
            test_db.query(AlertaModel)
            .filter_by(agente_tipo=TipoAgente.OPERATIVO.value)
            .order_by(AlertaModel.created_at.desc())
            .first()
        )
        assert alerta_operativa is not None
        assert alerta_operativa.severidad in [SeveridadAlerta.CRITICA.value, SeveridadAlerta.ALTA.value]
        assert alerta_operativa.valor_observado == 40.0

    asyncio.run(run())

def test_level_4_sensitive_action_requires_explicit_human_authorization():
    """
    Valida que ninguna acción sensible de Nivel 4 se ejecute automáticamente.
    Debe permanecer en estado PENDIENTE_APROBACION con cero ejecuciones no autorizadas.
    """
    regla_nivel_4 = ReglaMonitoreo(
        id="RULE-SENSIBLE-01",
        agente_tipo=TipoAgente.COMERCIAL,
        nombre="Modificación de tarifas y campañas comerciales",
        indicador_clave="VARIACION_MATRICULAS_PCT",
        sede_id="SEDE-CENTRAL",
        umbral_preventivo=-15.0,
        umbral_critico=-30.0,
        nivel_autonomia=NivelAutonomia.ACCION_SENSIBLE # Nivel 4
    )

    alerta = Alerta(
        id="ALERT-TEST-001",
        regla_id=regla_nivel_4.id,
        agente_tipo=regla_nivel_4.agente_tipo,
        sede_id="SEDE-CENTRAL",
        titulo="Test Alerta Nivel 4",
        severidad=SeveridadAlerta.CRITICA,
        valor_observado=-35.0,
        condicion_activadora="Matriculas cayeron -35%",
        explicacion="Caída severa",
        recomendacion="Modificar precios y campañas"
    )

    accion = RulesEngine.determinar_accion(regla_nivel_4, alerta)
    assert accion is not None
    assert accion.nivel_autonomia == NivelAutonomia.ACCION_SENSIBLE
    assert accion.estado == EstadoAccion.PENDIENTE_APROBACION, "Las acciones de Nivel 4 deben quedar pendientes de aprobación humana"
    assert accion.aprobado_por is None

def test_cycle_latency_under_10_seconds(test_db):
    """
    Comprueba que el ciclo completo O-A-D-A-E se ejecute en menos de 10 segundos
    (Métrica de aceptación de la Sección 13).
    """
    async def run():
        start = time.time()
        res = await AgentOrchestratorService.ejecutar_ciclo_completo(
            db=test_db,
            tipo_ejecucion=TipoEjecucion.SIMULACION
        )
        elapsed = time.time() - start
        assert elapsed < 10.0, f"La latencia del ciclo ({elapsed}s) superó los 10 segundos requeridos"
        assert res["latencia_ms"] < 10000.0

    asyncio.run(run())

