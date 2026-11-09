import asyncio
from unittest.mock import AsyncMock, patch
import httpx
from app.infrastructure.tools.gym_tools import GymToolsAdapter


def test_unavailable_sources_are_not_reliable():
    async def run():
        with patch("httpx.AsyncClient.post", new=AsyncMock(side_effect=httpx.ConnectError("offline"))):
            attendance = await GymToolsAdapter.obtener_asistencias("2026-01-01", "2026-01-31")
            enrollments = await GymToolsAdapter.obtener_resumen_inscripciones()
        assert not attendance.confiable
        assert not enrollments.confiable
        assert attendance.valor_referencia is None
        assert enrollments.valor_referencia is None
    asyncio.run(run())


def test_service_failure_never_returns_demo_readings():
    async def run():
        with patch("httpx.AsyncClient.post", new=AsyncMock(side_effect=httpx.ConnectError("offline"))), \
             patch("httpx.AsyncClient.get", new=AsyncMock(side_effect=httpx.ConnectError("offline"))):
            readings = [await GymToolsAdapter.obtener_aforo_actual(),
                await GymToolsAdapter.obtener_membresias_por_vencer(),
                await GymToolsAdapter.obtener_resumen_riesgo_abandono()]
        assert all(not reading.confiable for reading in readings)
        assert all(reading.valor_referencia is None for reading in readings)
    asyncio.run(run())


def test_empty_dashboard_has_no_demo_metrics():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.infrastructure.db import Base
    from app.presentation.api_router import get_dashboard_summary
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        result = get_dashboard_summary(db)
        assert result["aforo_actual_pct"] is None
        assert result["aforo_presentes"] is None
        assert result["alertas_abiertas"] == 0
        assert result["metricas_validacion"]["precision_alertas_pct"] is None
        assert result["metricas_validacion"]["latencia_media_segundos"] is None


def test_api_rejects_scenarios_and_overrides():
    import pytest
    from pydantic import ValidationError
    from app.presentation.api_router import EjecutarCicloDTO, router
    for payload in [{"escenario": "AFORO_92"}, {"override_indicadores": {"aforo_pct": 100}}, {"tipo_ejecucion": "SIMULACION"}]:
        with pytest.raises(ValidationError):
            EjecutarCicloDTO(**payload)
    assert all("simulador" not in route.path for route in router.routes)
