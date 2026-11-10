import csv
import io
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List

from ...config import settings
from ..db.storage import storage_service
from ...domain.models import ReportResult, ExportFileRecord, ExportFormat

def sanitize_csv_cell(value: Any) -> str:
    """
    Protección contra inyección de fórmulas CSV (OWASP CSV Injection).
    Si el valor comienza con '=', '+', '-', '@', tabulación o retorno de carro,
    se antepone un apóstrofe para forzar al visor a tratarlo como texto plano.
    """
    if value is None:
        return ""
    text = str(value)
    if text and text[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{text}"
    return text

class CsvExporter:
    @staticmethod
    def export(report: ReportResult) -> ExportFileRecord:
        file_id = f"exp-csv-{uuid.uuid4().hex[:12]}"
        clean_name = report.herramienta.replace(" ", "_").lower()
        filename = f"{clean_name}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
        file_path = settings.EXPORTS_DIR / filename

        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        # Metadatos del encabezado
        writer.writerow(["# APEXFITNESS - CENTRO DE REPORTES INTELIGENTES (MCP)"])
        writer.writerow(["# Herramienta:", sanitize_csv_cell(report.herramienta)])
        writer.writerow(["# Titulo:", sanitize_csv_cell(report.titulo)])
        writer.writerow(["# Periodo:", sanitize_csv_cell(report.periodo_interpretado)])
        writer.writerow(["# Zona Horaria:", sanitize_csv_cell(report.zona_horaria)])
        writer.writerow(["# Fecha de Corte:", sanitize_csv_cell(report.fecha_corte)])
        writer.writerow(["# Estado de Cobertura:", sanitize_csv_cell(report.estado.value)])
        if report.advertencias:
            writer.writerow(["# Advertencias:", sanitize_csv_cell(" | ".join(report.advertencias))])
        writer.writerow([])

        # Resumen de totales
        if report.totales:
            writer.writerow(["--- RESUMEN DE TOTALES ---"])
            for k, v in report.totales.items():
                writer.writerow([sanitize_csv_cell(k), sanitize_csv_cell(v)])
            writer.writerow([])

        # Datos tabulares
        if report.filas:
            headers = list(report.filas[0].keys())
            writer.writerow([sanitize_csv_cell(h) for h in headers])
            for row in report.filas:
                writer.writerow([sanitize_csv_cell(row.get(h, "")) for h in headers])
        else:
            writer.writerow(["Sin registros disponibles para el criterio especificado."])

        csv_content = output.getvalue().encode("utf-8-sig")  # BOM para compatibilidad con Excel
        with open(file_path, "wb") as f:
            f.write(csv_content)

        expires_at = (datetime.now(timezone.utc) + timedelta(hours=settings.EXPORT_EXPIRATION_HOURS)).isoformat()
        storage_service.insert_export(
            file_id=file_id,
            filename=filename,
            file_path=str(file_path),
            formato=ExportFormat.CSV.value,
            reporte_nombre=report.herramienta,
            tamanio_bytes=len(csv_content),
            expires_at=expires_at
        )

        return ExportFileRecord(
            file_id=file_id,
            filename=filename,
            file_path=str(file_path),
            formato=ExportFormat.CSV,
            reporte_nombre=report.herramienta,
            tamanio_bytes=len(csv_content),
            created_at=datetime.now(timezone.utc).isoformat(),
            expires_at=expires_at
        )

    export_to_csv = export
    _sanitize_cell = staticmethod(sanitize_csv_cell)

csv_exporter = CsvExporter()

