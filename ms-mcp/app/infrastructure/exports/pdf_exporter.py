import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable
)

from ...config import settings
from ..db.storage import storage_service
from ...domain.models import ReportResult, ExportFileRecord, ExportFormat

class PdfExporter:
    @staticmethod
    def export(report: ReportResult) -> ExportFileRecord:
        file_id = f"exp-pdf-{uuid.uuid4().hex[:12]}"
        clean_name = report.herramienta.replace(" ", "_").lower()
        filename = f"{clean_name}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.pdf"
        file_path = settings.EXPORTS_DIR / filename

        doc = SimpleDocTemplate(
            str(file_path),
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Paleta institucional ApexFitness
        c_dark = colors.HexColor("#162026")
        c_forest = colors.HexColor("#5A7863")
        c_sage = colors.HexColor("#90AB8B")
        c_cream = colors.HexColor("#EBF4DD")
        c_amber = colors.HexColor("#D97706")
        c_danger = colors.HexColor("#EF4444")
        c_zebra = colors.HexColor("#F8FAFC")

        title_style = ParagraphStyle(
            "ApexTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=c_dark
        )

        sub_style = ParagraphStyle(
            "ApexSub",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#475569")
        )

        meta_label = ParagraphStyle(
            "ApexMetaLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=c_forest
        )

        meta_val = ParagraphStyle(
            "ApexMetaVal",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=c_dark
        )

        table_header_style = ParagraphStyle(
            "ApexTH",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.white
        )

        cell_style = ParagraphStyle(
            "ApexCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9.5,
            textColor=c_dark
        )

        story = []

        # 1. Cabecera institucional
        header_table = Table([
            [
                Paragraph("<b>APEX FITNESS</b> • CENTRO DE REPORTES INTELIGENTES (MCP)", title_style),
                Paragraph(f"<b>Estado: {report.estado.value}</b>", ParagraphStyle(
                    "Badge",
                    parent=styles["Normal"],
                    fontName="Helvetica-Bold",
                    fontSize=10,
                    textColor=c_forest if report.estado.value == "COMPLETO" else (c_amber if report.estado.value == "PARCIAL" else c_danger),
                    alignment=2
                ))
            ]
        ], colWidths=[400, 140])
        story.append(header_table)
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=1.5, color=c_forest, spaceBefore=2, spaceAfter=8))

        # 2. Título del Reporte y Periodo
        story.append(Paragraph(f"<b>Reporte:</b> {report.titulo}", ParagraphStyle("RepTitle", parent=title_style, fontSize=12, leading=14)))
        story.append(Spacer(1, 4))

        meta_data = [
            [Paragraph("<b>Periodo interpretado:</b>", meta_label), Paragraph(report.periodo_interpretado, meta_val)],
            [Paragraph("<b>Zona horaria / Corte:</b>", meta_label), Paragraph(f"{report.zona_horaria} • Corte: {report.fecha_corte}", meta_val)],
            [Paragraph("<b>Definición:</b>", meta_label), Paragraph(report.definicion, meta_val)],
            [Paragraph("<b>Cobertura:</b>", meta_label), Paragraph(report.cobertura, meta_val)]
        ]
        meta_table = Table(meta_data, colWidths=[120, 420])
        meta_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 8))

        # 3. Advertencias / Limitaciones si existen
        if report.advertencias:
            adv_text = " • ".join(report.advertencias)
            adv_box = Table([[
                Paragraph(f"<b>ADVERTENCIA:</b> {adv_text}", ParagraphStyle("Adv", parent=sub_style, fontSize=8, textColor=colors.HexColor("#92400E")))
            ]], colWidths=[540])
            adv_box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#F59E0B")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(adv_box)
            story.append(Spacer(1, 8))

        # 4. Resumen de Totales
        if report.totales:
            story.append(Paragraph("<b>Métricas y Totales Consolidados</b>", ParagraphStyle("TotTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, leading=11, textColor=c_forest)))
            story.append(Spacer(1, 3))
            tot_rows = []
            curr_row = []
            for k, v in report.totales.items():
                curr_row.extend([Paragraph(f"<b>{k}:</b>", meta_label), Paragraph(str(v), meta_val)])
                if len(curr_row) == 4:
                    tot_rows.append(curr_row)
                    curr_row = []
            if curr_row:
                while len(curr_row) < 4:
                    curr_row.append(Paragraph("", meta_val))
                tot_rows.append(curr_row)

            tot_table = Table(tot_rows, colWidths=[110, 160, 110, 160])
            tot_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]))
            story.append(tot_table)
            story.append(Spacer(1, 10))

        # 5. Tabla de Registros
        story.append(Paragraph(f"<b>Detalle de Registros ({report.total_filas} filas)</b>", ParagraphStyle("DetTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, leading=11, textColor=c_dark)))
        story.append(Spacer(1, 4))

        if report.filas:
            headers = list(report.filas[0].keys())[:8]  # Máximo 8 columnas para ajuste en página
            table_data = [[Paragraph(f"<b>{h}</b>", table_header_style) for h in headers]]
            
            # Limitar a las primeras 300 filas en el PDF para evitar desbordes masivos
            display_rows = report.filas[:300]
            for idx, r in enumerate(display_rows):
                row_cells = [Paragraph(str(r.get(h, "")), cell_style) for h in headers]
                table_data.append(row_cells)

            col_width = 540 / len(headers)
            col_widths = [col_width] * len(headers)
            
            grid_table = Table(table_data, colWidths=col_widths, repeatRows=1)
            t_style = [
                ("BACKGROUND", (0, 0), (-1, 0), c_forest),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ]
            for i in range(1, len(table_data)):
                if i % 2 == 0:
                    t_style.append(("BACKGROUND", (0, i), (-1, i), c_zebra))
            grid_table.setStyle(TableStyle(t_style))
            story.append(grid_table)

            if len(report.filas) > 300:
                story.append(Spacer(1, 4))
                story.append(Paragraph(f"<i>Nota: Se muestran 300 de {len(report.filas)} registros en esta vista previa PDF. El archivo CSV contiene el 100% de los datos.</i>", sub_style))
        else:
            story.append(Paragraph("<i>No se encontraron registros coincidentes con los criterios de búsqueda.</i>", sub_style))

        # 6. Pie de página y aviso de integridad
        story.append(Spacer(1, 14))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceBefore=4, spaceAfter=4))
        footer_text = (
            f"Documento generado automáticamente por ms-mcp ApexFitness. Los cálculos numéricos son "
            f"ejecutados de forma determinista sobre las fuentes declaradas. Descarga autorizada con vigencia de "
            f"{settings.EXPORT_EXPIRATION_HOURS} horas."
        )
        story.append(Paragraph(footer_text, ParagraphStyle("Footer", parent=sub_style, fontSize=7, leading=9, textColor=colors.HexColor("#64748B"))))

        doc.build(story)

        file_bytes = file_path.stat().st_size
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=settings.EXPORT_EXPIRATION_HOURS)).isoformat()
        
        storage_service.insert_export(
            file_id=file_id,
            filename=filename,
            file_path=str(file_path),
            formato=ExportFormat.PDF.value,
            reporte_nombre=report.herramienta,
            tamanio_bytes=file_bytes,
            expires_at=expires_at
        )

        return ExportFileRecord(
            file_id=file_id,
            filename=filename,
            file_path=str(file_path),
            formato=ExportFormat.PDF,
            reporte_nombre=report.herramienta,
            tamanio_bytes=file_bytes,
            created_at=datetime.now(timezone.utc).isoformat(),
            expires_at=expires_at
        )

    export_to_pdf = export

pdf_exporter = PdfExporter()

