import asyncio
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.infrastructure.tools.gym_tools import GymToolsAdapter
from app.domain.entities import ReglaMonitoreo, TipoAgente
from app.domain.rules_engine import RulesEngine
from app.infrastructure.json_data import parse_json_object


@pytest.mark.parametrize("value", [None, "", "broken", "null", "[]", "3"])
def test_persisted_json_requires_an_object(value):
    assert parse_json_object(value) == {}


def test_persisted_json_preserves_valid_evidence():
    assert parse_json_object('{"unidad":"%","valor":0}') == {"unidad": "%", "valor": 0}


def response(body):
    return httpx.Response(200, json=body, request=httpx.Request("POST", "http://inventario/graphql"))


def test_equipment_pagination_and_quantities():
    pages = [response({"data": {"equipos": {
        "data": [{"nombre": "Caminadora", "cantidad": 8, "estado": "OPERATIVO"}],
        "paginatorInfo": {"hasMorePages": True},
    }}}), response({"data": {"equipos": {
        "data": [{"nombre": "Treadmill", "cantidad": 2, "estado": "EN_REVISION"}],
        "paginatorInfo": {"hasMorePages": False},
    }}})]
    with patch("httpx.AsyncClient.post", new=AsyncMock(side_effect=pages)) as post:
        indicator = asyncio.run(GymToolsAdapter.obtener_equipos_fuera_servicio())
    assert post.await_count == 2
    assert indicator.confiable
    assert indicator.valor_actual == 80
    assert indicator.metadata["total_equipos"] == 10


@pytest.mark.parametrize("body", [{"errors": [{"message": "invalid query"}]}, {"data": None}])
def test_invalid_response_does_not_trigger_or_resolve_alerts(body):
    with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=response(body))):
        indicator = asyncio.run(GymToolsAdapter.obtener_equipos_fuera_servicio())
    assert not indicator.confiable
    rule = ReglaMonitoreo(id="test", agente_tipo=TipoAgente.OPERATIVO,
        nombre="Equipos", indicador_clave="DISPONIBILIDAD_EQUIPOS_PCT",
        sede_id="SEDE-CENTRAL", umbral_preventivo=60, umbral_critico=45)
    assert RulesEngine.evaluar_indicador(rule, indicator) == (None, None)
    assert RulesEngine.procesar_alerta_con_deduplicacion(rule, None, indicator, None)[1] == "SIN_CAMBIOS"


def test_alert_refresh_keeps_title_condition_and_evidence_consistent():
    from app.domain.entities import IndicadorNegocio
    rule = ReglaMonitoreo(id="test", agente_tipo=TipoAgente.OPERATIVO,
        nombre="Equipos", indicador_clave="DISPONIBILIDAD_EQUIPOS_PCT",
        sede_id="SEDE-CENTRAL", umbral_preventivo=60, umbral_critico=45)
    indicator = IndicadorNegocio(nombre="Disponibilidad de Equipos Críticos",
        valor_actual=40, unidad="%", sede_id="SEDE-CENTRAL",
        servicio_origen="ms-inventario", confiable=True)
    anomaly, _ = RulesEngine.evaluar_indicador(rule, indicator)
    alert, _, _ = RulesEngine.procesar_alerta_con_deduplicacion(rule, anomaly, indicator, None)
    indicator.valor_actual = 30
    anomaly, _ = RulesEngine.evaluar_indicador(rule, indicator)
    updated, _, _ = RulesEngine.procesar_alerta_con_deduplicacion(rule, anomaly, indicator, alert)
    assert updated.id == alert.id
    assert updated.valor_observado == 30
    assert "30" in updated.titulo
    assert "30%" in updated.condicion_activadora
    assert updated.evidencia_json["valor_observado"] == 30
