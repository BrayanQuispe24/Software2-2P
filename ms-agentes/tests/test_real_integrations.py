import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.application.orchestrator_service import AgentOrchestratorService as O
from app.domain.entities import EstadoAlerta, ReglaMonitoreo, TipoAgente, IndicadorNegocio
from app.domain.rules_engine import RulesEngine
from app.infrastructure.db import Base
from app.infrastructure.models import AlertaModel, ReglaMonitoreoModel, AccionAgenteModel, HistorialDecisionModel
from app.infrastructure.tools.gym_tools import GymToolsAdapter as T
from app.infrastructure.schema import ensure_schema
from app.presentation.api_router import (AutorizarAccionDTO, authorize_level_4_action,
    ExplicacionIaDTO, sync_explanation, evidence_hash, ActualizarReglaDTO)


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    ensure_schema(engine, Base.metadata)
    ensure_schema(engine, Base.metadata)
    with Session(engine) as session:
        O.seed_initial_config_if_empty(session)
        yield session


def access(cliente, movement, days=0, permitted=True):
    return {"id": f"{cliente}-{movement}-{days}", "clienteId": cliente,
        "tipoMovimiento": movement, "estadoAcceso": "PERMITIDO" if permitted else "DENEGADO",
        "fechaHora": (datetime.now(timezone.utc)-timedelta(days=days)).isoformat()}


def test_occupancy_counts_latest_permitted_movement_per_customer():
    rows = [access("a", "ENTRADA", 2), access("a", "SALIDA", 1), access("b", "ENTRADA"),
        access("c", "ENTRADA", permitted=False)]
    with patch("app.infrastructure.tools.gym_tools.graphql", new=AsyncMock(return_value={"disciplinas": [{"capacidadMaxima": 10}]})), \
         patch("app.infrastructure.tools.gym_tools.accesses", new=AsyncMock(return_value=rows)):
        r = asyncio.run(T.obtener_aforo_actual())
    assert r.confiable and r.valor_actual == 10
    assert r.metadata["presentes"] == 1


def test_enrollment_variation_uses_registration_dates():
    now = datetime.now(timezone.utc)
    rows = [{"createdAt": (now-timedelta(days=d)).isoformat(), "estado": "ACTIVA"} for d in [1, 8, 9]]
    with patch("app.infrastructure.tools.gym_tools.enrollments", new=AsyncMock(return_value=rows)):
        r = asyncio.run(T.obtener_resumen_inscripciones())
    assert r.confiable and r.valor_actual == -50
    assert r.metadata["matriculas_periodo_actual"] == 1
    assert r.metadata["matriculas_periodo_anterior"] == 2


def test_no_prior_enrollments_does_not_invent_a_percentage():
    with patch("app.infrastructure.tools.gym_tools.enrollments", new=AsyncMock(return_value=[])):
        r = asyncio.run(T.obtener_resumen_inscripciones())
    assert not r.confiable


def test_attendance_filters_dates_and_denied_access():
    rows = [access("a", "ENTRADA"), access("a", "SALIDA"), access("b", "ENTRADA", 15), access("c", "ENTRADA", permitted=False)]
    today = datetime.now(timezone.utc).date().isoformat()
    with patch("app.infrastructure.tools.gym_tools.accesses", new=AsyncMock(return_value=rows)):
        r = asyncio.run(T.obtener_asistencias(today, today))
    assert r.confiable and r.valor_actual == 1


def test_retention_fallback_is_real_inactivity_and_not_claimed_as_ml():
    now = datetime.now(timezone.utc)
    rows = [{"clienteId": c, "estado": "ACTIVA", "fechaInicio": (now-timedelta(days=40)).date().isoformat(),
        "fechaFin": (now+timedelta(days=10)).date().isoformat()} for c in ["a", "b"]]
    with patch("httpx.AsyncClient.get", new=AsyncMock(side_effect=httpx.ConnectError("ML unavailable"))), \
         patch("app.infrastructure.tools.gym_tools.enrollments", new=AsyncMock(return_value=rows)), \
         patch("app.infrastructure.tools.gym_tools.accesses", new=AsyncMock(return_value=[access("b", "ENTRADA")])):
        r = asyncio.run(T.obtener_resumen_riesgo_abandono())
    assert r.confiable and r.valor_actual == 50
    assert r.metadata["metodo"] == "REGLA_INACTIVIDAD"
    assert r.metadata["es_prediccion_ml"] is False


def make_alert(db, age_minutes=0):
    now = datetime.now(timezone.utc)
    row = AlertaModel(id="alert-test", regla_id="RULE-AFORO-01", agente_tipo="AFORO", sede_id="SEDE-CENTRAL",
        titulo="Aforo", severidad="PREVENTIVA", estado="DETECTADA", valor_observado=92,
        condicion_activadora="Aforo = 92%", explicacion="Ocupación elevada", recomendacion="Revisar accesos",
        evidencia_json='{"unidad":"%"}', created_at=now-timedelta(minutes=age_minutes), updated_at=now)
    db.add(row); db.commit()
    return row


def test_cooldown_expires_even_when_alert_is_updated(db):
    row = make_alert(db)
    row.created_at = datetime.now(timezone.utc)-timedelta(hours=1)
    row.ultima_notificacion_at = datetime.now(timezone.utc)-timedelta(seconds=61)
    rule = ReglaMonitoreo(id="rule", nombre="Aforo", agente_tipo=TipoAgente.AFORO,
        indicador_clave="AFORO", umbral_preventivo=90, umbral_critico=100, cooldown_seg=60)
    indicator = IndicadorNegocio(nombre="Aforo", valor_actual=92, unidad="%", sede_id="SEDE-CENTRAL", servicio_origen="test")
    anomaly, _ = RulesEngine.evaluar_indicador(rule, indicator)
    _, change, action = RulesEngine.procesar_alerta_con_deduplicacion(rule, anomaly, indicator, O.to_alert(row))
    assert change == "ACTUALIZADA_POST_COOLDOWN" and action is not None


def test_approval_is_not_execution_and_cannot_be_repeated(db):
    make_alert(db)
    row = AccionAgenteModel(id="action", alerta_id="alert-test", tipo_accion="PROPUESTA",
        nivel_autonomia=4, estado="PENDIENTE_APROBACION")
    db.add(row); db.commit()
    dto = AutorizarAccionDTO(aprobado=True, aprobado_por="forged-user")
    authorize_level_4_action("action", dto, db, "authenticated-admin")
    assert row.estado == "APROBADA" and row.executed_at is None
    assert row.aprobado_por == "authenticated-admin"
    with pytest.raises(HTTPException) as error:
        authorize_level_4_action("action", dto, db, "authenticated-admin")
    assert error.value.status_code == 409


def test_ai_sync_requires_the_current_evidence_and_writes_audit(db):
    row = make_alert(db)
    dto = ExplicacionIaDTO(explicacion="La ocupación requiere revisión.", recomendacion="Revisar el aforo.",
        modelo_ia_browser="real-local-model", evidencia_hash=evidence_hash(row))
    sync_explanation(row.id, dto, db)
    assert row.modelo_ia_browser == "real-local-model"
    assert db.query(HistorialDecisionModel).filter_by(ejecucion_id="BROWSER-LLM").count() == 1
    row.valor_observado = 100; db.commit()
    with pytest.raises(HTTPException) as error:
        sync_explanation(row.id, dto, db)
    assert error.value.status_code == 409


def test_schedule_supports_midnight_and_disabled_rules(db):
    rule = db.query(ReglaMonitoreoModel).first()
    rule.horario_inicio, rule.horario_fin = "22:00", "06:00"
    assert O.regla_activa_ahora(rule, datetime(2026,1,1,4,0,tzinfo=timezone.utc))
    assert not O.regla_activa_ahora(rule, datetime(2026,1,1,16,0,tzinfo=timezone.utc))
    rule.activa = False
    assert not O.regla_activa_ahora(rule, datetime(2026,1,1,4,0,tzinfo=timezone.utc))


@pytest.mark.parametrize("field,value", [("nivel_autonomia", 5), ("cooldown_seg", -1), ("duracion_minima_seg", -1), ("umbral_critico", float("nan"))])
def test_invalid_rule_parameters_are_rejected(field, value):
    from pydantic import ValidationError
    params = {"umbral_preventivo": 90, "umbral_critico": 100, field: value}
    with pytest.raises(ValidationError):
        ActualizarReglaDTO(**params)


def test_http_api_requires_gateway_token(monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.config import settings
    monkeypatch.setattr(settings, "INTERNAL_API_TOKEN", "test-only-secret")
    client = TestClient(app)
    assert client.get("/api/v1/health/ready").status_code == 401
    assert client.get("/api/v1/health/ready", headers={"X-Internal-Token": "wrong"}).status_code == 401
    assert client.get("/api/v1/health/ready", headers={"X-Internal-Token": "test-only-secret"}).status_code == 200


def test_sustained_anomaly_duration_and_resolution(db):
    from test_agent_engine import run_test_cycle
    from app.domain.entities import TipoEjecucion
    rule = db.query(ReglaMonitoreoModel).filter_by(agente_tipo="AFORO").one()
    rule.duracion_minima_seg = 300
    db.commit()
    asyncio.run(run_test_cycle(db, TipoEjecucion.MANUAL, {"aforo_pct": 92}))
    assert db.query(AlertaModel).filter_by(agente_tipo="AFORO").count() == 0
    rule.anomalia_desde = datetime.now(timezone.utc)-timedelta(seconds=301)
    db.commit()
    asyncio.run(run_test_cycle(db, TipoEjecucion.MANUAL, {"aforo_pct": 92}))
    assert db.query(AlertaModel).filter_by(agente_tipo="AFORO").count() == 1
    asyncio.run(run_test_cycle(db, TipoEjecucion.MANUAL, {"aforo_pct": 80}))
    assert db.query(AlertaModel).filter_by(agente_tipo="AFORO").one().estado == "RESUELTA"
    assert rule.anomalia_desde is None


def test_followup_uses_configured_sla_and_respects_disabled_rule(db):
    from test_agent_engine import run_test_cycle
    from app.domain.entities import TipoEjecucion
    row = make_alert(db, age_minutes=4)
    rule = db.query(ReglaMonitoreoModel).filter_by(agente_tipo="SEGUIMIENTO").one()
    rule.umbral_preventivo, rule.umbral_critico = 2, 3
    rule.activa = False
    db.commit()
    asyncio.run(run_test_cycle(db, TipoEjecucion.MANUAL))
    assert row.estado == "DETECTADA"
    rule.activa = True; db.commit()
    asyncio.run(run_test_cycle(db, TipoEjecucion.MANUAL))
    assert row.estado == "ESCALADA"


def test_outbox_failure_is_persisted_without_execution_timestamp(db):
    make_alert(db)
    row = AccionAgenteModel(id="queued", alerta_id="alert-test", tipo_accion="DESPACHAR_WEBHOOK_N8N",
        nivel_autonomia=3, estado="SOLICITADA", payload_json='{"destinatarios":["configured-recipient"]}')
    db.add(row); db.commit()
    with patch.object(T, "solicitar_notificacion", new=AsyncMock(return_value=False)):
        asyncio.run(O.dispatch_pending_actions(db))
    assert row.estado == "FALLIDA" and row.executed_at is None


def test_backend_rejects_admin_operations_from_reader(monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.config import settings
    monkeypatch.setattr(settings, "INTERNAL_API_TOKEN", "test-only-secret")
    client = TestClient(app)
    response = client.put("/api/v1/reglas/example", headers={"X-Internal-Token": "test-only-secret", "X-Actor-Role": "LECTOR"},
        json={"umbral_preventivo": 90, "umbral_critico": 100})
    assert response.status_code == 403


def test_dispatch_reports_missing_recipients_before_attempting_delivery(db):
    import json
    from app.presentation.api_router import list_actions, execute_approved_action
    alert = make_alert(db)
    action = AccionAgenteModel(id="approved-no-recipient", alerta_id=alert.id,
        tipo_accion="PROPUESTA", nivel_autonomia=4, estado="APROBADA", aprobado_por="admin",
        payload_json=json.dumps({"valor_observado": alert.valor_observado, "evidencia": json.loads(alert.evidencia_json)}))
    db.add(action); db.commit()
    result = list_actions(db)[0]
    assert result["puede_despachar"] is False
    assert "destinatarios" in result["motivo_bloqueo"]
    assert result["regla_id"] == alert.regla_id
    with patch.object(T, "solicitar_notificacion", new=AsyncMock()) as delivery:
        with pytest.raises(HTTPException) as error:
            asyncio.run(execute_approved_action(action.id, db))
        assert error.value.status_code == 422
        delivery.assert_not_called()
    rule = db.get(ReglaMonitoreoModel, alert.regla_id)
    rule.destinatarios = ["configured@example.test"]; db.commit()
    assert list_actions(db)[0]["puede_despachar"] is True
