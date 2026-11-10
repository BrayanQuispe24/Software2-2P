import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, date
from app.domain.models import ReportStatus
from app.application.reports_service import reports_service
from app.infrastructure.exports.csv_exporter import csv_exporter
from app.infrastructure.auth.token_service import token_service
from app.infrastructure.db.storage import storage_service

@pytest.fixture(autouse=True)
def setup_test_db(tmp_path, monkeypatch):
    test_db = tmp_path / "test_mcp.db"
    monkeypatch.setattr(storage_service, "db_path", test_db)
    storage_service._init_db()

# 1. Sanitización de CSV contra inyecciones OWASP
def test_csv_sanitization_owasp():
    dangerous_inputs = ["=SUM(A1:A10)", "+cmd|'/c calc'!A1", "-1+2", "@SUM", "%test", "Normal Text", 1234]
    sanitized = [csv_exporter._sanitize_cell(val) for val in dangerous_inputs]
    assert sanitized[0] == "'=SUM(A1:A10)"
    assert sanitized[1] == "'+cmd|'/c calc'!A1"
    assert sanitized[2] == "'-1+2"
    assert sanitized[3] == "'@SUM"
    assert sanitized[4] == "%test"
    assert sanitized[5] == "Normal Text"
    assert sanitized[6] == "1234"

# 2. Token Service: Creación, Validación y Scopes
def test_token_service_lifecycle():
    raw_token, record = token_service.generate_token(
        name="Test Token",
        owner="test-agent",
        scopes=["asistencia", "membresias"]
    )
    assert raw_token.startswith("mcp_")
    assert record["owner"] == "test-agent"
    assert "asistencia" in record["scopes"]

    # Validar
    is_valid, _, val_dict = token_service.validate_token(raw_token)
    assert is_valid is True
    assert val_dict is not None
    assert val_dict["owner"] == "test-agent"

    # Revocar
    assert token_service.revoke_token(record["token_id"]) is True
    is_valid_after, _, _ = token_service.validate_token(raw_token)
    assert is_valid_after is False

# 3. Reportes sin fuente implementada (Preguntas 11 y 12)
@pytest.mark.asyncio
async def test_ranking_productos_vendidos_no_implementado():
    res = await reports_service.ranking_productos_vendidos(mes=5, anio=2024)
    assert res.estado == ReportStatus.NO_IMPLEMENTADO
    assert res.total_filas == 0
    assert "no cuenta actualmente con un módulo de tienda" in res.advertencias[0]

@pytest.mark.asyncio
async def test_listar_productos_stock_bajo_no_implementado():
    res = await reports_service.listar_productos_stock_bajo(umbral_minimo=5)
    assert res.estado == ReportStatus.NO_IMPLEMENTADO
    assert res.total_filas == 0

# 4. Fallo de Microservicio remoto produce estado NO_DISPONIBLE
@pytest.mark.asyncio
async def test_gym_failure_returns_no_disponible():
    with patch("app.infrastructure.adapters.gym_adapter.gym_adapter.get_all_enrollments", side_effect=Exception("Connection refused")):
        res = await reports_service.listar_inscripciones()
        assert res.estado == ReportStatus.NO_DISPONIBLE
        assert "No se pudo consultar ms-gimnasio" in res.advertencias[0]

# 5. Capacidades de reportes cubre 20 preguntas
def test_capacidades_reportes_completeness():
    caps = reports_service.obtener_capacidades_reportes()
    assert caps["total_herramientas"] == 17
    assert caps["preguntas_de_negocio_cubiertas"] == 20
    assert len(caps["herramientas"]) == 17
