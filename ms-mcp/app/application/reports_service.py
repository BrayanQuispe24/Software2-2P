import logging
from datetime import datetime, date, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Dict, Any, List, Optional, Tuple
from collections import defaultdict

from ..config import settings
from ..domain.models import ReportResult, ReportStatus, SourceCoverage, ToolMetadata, ToolParameter
from ..infrastructure.adapters.gym_adapter import gym_adapter, parse_utc, to_local_date
from ..infrastructure.adapters.inventory_adapter import inventory_adapter
from ..infrastructure.adapters.training_adapter import training_adapter
from ..infrastructure.adapters.auth_adapter import auth_adapter

logger = logging.getLogger("ms-mcp.reports-service")

class ReportsService:
    def __init__(self):
        self.tz = ZoneInfo(settings.DEFAULT_TIMEZONE)

    def _now_local(self) -> datetime:
        return datetime.now(self.tz)

    def _parse_month_year(self, mes: Optional[int], anio: Optional[int]) -> Tuple[date, date, str]:
        """
        Retorna (inicio_mes_inclusivo, fin_mes_exclusivo, descripcion_periodo).
        Si no se indica mes, utiliza el mes calendario anterior (último mes cerrado).
        """
        hoy = self._now_local().date()
        target_year = anio or hoy.year

        if mes is None:
            # Mes calendario anterior
            if hoy.month == 1:
                target_month = 12
                target_year = hoy.year - 1
            else:
                target_month = hoy.month - 1
            desc_tipo = "último mes calendario cerrado"
        else:
            if not (1 <= mes <= 12):
                raise ValueError("El parámetro 'mes' debe ser un entero entre 1 y 12")
            target_month = mes
            desc_tipo = f"mes {target_month:02d}"

        inicio = date(target_year, target_month, 1)
        if target_month == 12:
            fin = date(target_year + 1, 1, 1)
        else:
            fin = date(target_year, target_month + 1, 1)

        desc = f"{inicio.isoformat()} hasta {fin.isoformat()} ({desc_tipo} de {target_year}, inicio inclusivo, fin exclusivo)"
        return inicio, fin, desc

    # =========================================================================
    # REPORTE 1: Clientes inscritos el último mes (listar_inscripciones)
    # =========================================================================
    async def listar_inscripciones(
        self,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None,
        estado: Optional[str] = None,
        tipo: str = "TODAS",
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        fuentes = [SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="Query inscripcionesPagina")]

        if fecha_inicio and fecha_fin:
            d_inicio = date.fromisoformat(fecha_inicio)
            d_fin = date.fromisoformat(fecha_fin)
            periodo = f"{d_inicio.isoformat()} hasta {d_fin.isoformat()} (rango personalizado, inicio inclusivo, fin exclusivo)"
        else:
            d_inicio, d_fin, periodo = self._parse_month_year(None, None)

        try:
            raw_enrollments = await gym_adapter.get_all_enrollments()
        except Exception as exc:
            return ReportResult(
                herramienta="listar_inscripciones",
                titulo="Inscripciones y Matrículas en el Periodo",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="Fuente ms-gimnasio no disponible",
                definicion="Inscripciones filtradas por fecha real de creación (createdAt).",
                advertencias=[f"No se pudo consultar ms-gimnasio: {str(exc)}"],
                estado=ReportStatus.NO_DISPONIBLE
            )

        # Historial para detectar si es primera inscripción (NUEVA) o RENOVACION
        cliente_primera_fecha: Dict[str, datetime] = {}
        for r in raw_enrollments:
            c_id = r["clienteId"]
            dt_created = parse_utc(r["createdAt"])
            if c_id not in cliente_primera_fecha or dt_created < cliente_primera_fecha[c_id]:
                cliente_primera_fecha[c_id] = dt_created

        filas = []
        nuevas = 0
        renovaciones = 0

        for r in raw_enrollments:
            dt_created = parse_utc(r["createdAt"])
            d_created = to_local_date(dt_created, settings.DEFAULT_TIMEZONE)

            if d_inicio <= d_created < d_fin:
                if estado and r.get("estado") != estado:
                    continue

                es_primera = (dt_created <= cliente_primera_fecha[r["clienteId"]])
                tipo_inscripcion = "NUEVA" if es_primera else "RENOVACION"

                if tipo != "TODAS" and tipo != tipo_inscripcion:
                    continue

                if es_primera:
                    nuevas += 1
                else:
                    renovaciones += 1

                pago = r.get("boletaPago") or {}
                filas.append({
                    "id": r["id"],
                    "codigo_matricula": r.get("codigoMatricula", "N/A"),
                    "cliente_id": r["clienteId"],
                    "tipo_registro": tipo_inscripcion,
                    "plan": r.get("plan", {}).get("nombre", "Sin Plan"),
                    "estado": r.get("estado", "DESCONOCIDO"),
                    "fecha_creacion": dt_created.astimezone(self.tz).strftime("%Y-%m-%d %H:%M:%S"),
                    "fecha_inicio": r.get("fechaInicio"),
                    "fecha_fin": r.get("fechaFin"),
                    "monto_total_bob": float(pago.get("montoTotal") or 0.0),
                    "estado_pago": pago.get("estado", "SIN_BOLETA")
                })

        filas.sort(key=lambda x: x["fecha_creacion"], reverse=True)

        return ReportResult(
            herramienta="listar_inscripciones",
            titulo="Clientes e Inscripciones del Periodo",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% de inscripciones registradas en ms-gimnasio",
            totales={
                "total_inscripciones_periodo": len(filas),
                "nuevas_inscripciones": nuevas,
                "renovaciones": renovaciones,
                "socios_unicos": len(set(f["cliente_id"] for f in filas))
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Matrículas registradas considerando su fecha efectiva de creación (createdAt). Se clasifica como NUEVA si no existen registros previos del socio.",
            advertencias=[] if filas else ["No se registraron inscripciones en el rango de fechas indicado."],
            estado=ReportStatus.COMPLETO if filas else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 2 y 18: Asistencias y Accesos (reporte_asistencias)
    # =========================================================================
    async def reporte_asistencias(
        self,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None,
        mes: Optional[int] = None,
        anio: Optional[int] = None,
        hora_inicio: Optional[str] = None,  # "HH:MM" ej "06:00"
        hora_fin: Optional[str] = None,     # "HH:MM" ej "09:00"
        sede_id: str = "SEDE-CENTRAL",
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        fuentes = [SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="registrosAccesoPagina")]

        if fecha_inicio and fecha_fin:
            d_inicio = date.fromisoformat(fecha_inicio)
            d_fin = date.fromisoformat(fecha_fin)
            periodo = f"{d_inicio.isoformat()} hasta {d_fin.isoformat()} (inicio inclusivo, fin exclusivo)"
        elif fecha_inicio and not fecha_fin:
            # Caso de un solo día (ej. HOY)
            d_inicio = date.fromisoformat(fecha_inicio)
            d_fin = d_inicio + timedelta(days=1)
            periodo = f"Día {d_inicio.isoformat()} completo (00:00 hasta 24:00)"
        else:
            d_inicio, d_fin, periodo = self._parse_month_year(mes, anio)

        h_ini = None
        h_fin = None
        if hora_inicio and hora_fin:
            h_ini = datetime.strptime(hora_inicio, "%H:%M").time()
            h_fin = datetime.strptime(hora_fin, "%H:%M").time()
            periodo += f" [Franja horaria: {hora_inicio} a {hora_fin} (hora local)]"

        try:
            raw_accesses = await gym_adapter.get_all_accesses()
        except Exception as exc:
            return ReportResult(
                herramienta="reporte_asistencias",
                titulo="Reporte de Asistencias y Accesos al Gimnasio",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="Fuente ms-gimnasio caída o inalcanzable",
                definicion="Control de torniquetes y accesos autorizados.",
                advertencias=[f"Error al consultar accesos: {str(exc)}"],
                estado=ReportStatus.NO_DISPONIBLE
            )

        filas = []
        socios_unicos = set()
        total_entradas_permitidas = 0
        total_salidas = 0
        accesos_denegados = 0

        for r in raw_accesses:
            dt_utc = parse_utc(r["fechaHora"])
            dt_local = dt_utc.astimezone(self.tz)
            d_local = dt_local.date()

            if d_inicio <= d_local < d_fin:
                t_local = dt_local.time()
                if h_ini and h_fin:
                    if not (h_ini <= t_local < h_fin):
                        continue

                estado_acc = r.get("estadoAcceso")
                tipo_mov = r.get("tipoMovimiento")

                if estado_acc == "PERMITIDO" and tipo_mov == "ENTRADA":
                    total_entradas_permitidas += 1
                    socios_unicos.add(r["clienteId"])
                elif tipo_mov == "SALIDA":
                    total_salidas += 1
                elif estado_acc == "DENEGADO":
                    accesos_denegados += 1

                filas.append({
                    "id": r["id"],
                    "cliente_id": r["clienteId"],
                    "fecha_hora_local": dt_local.strftime("%Y-%m-%d %H:%M:%S"),
                    "tipo_movimiento": tipo_mov,
                    "estado_acceso": estado_acc,
                    "torniquete": r.get("dispositivoTorniquete", "TORNIQUETE-01"),
                    "motivo_denegacion": r.get("motivoDenegacion")
                })

        filas.sort(key=lambda x: x["fecha_hora_local"], reverse=True)

        return ReportResult(
            herramienta="reporte_asistencias",
            titulo="Reporte Oficial de Asistencias y Accesos",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% de eventos registrados en torniquetes y accesos",
            totales={
                "visitas_totales": total_entradas_permitidas,
                "socios_unicos": len(socios_unicos),
                "promedio_entradas_por_socio": round(total_entradas_permitidas / len(socios_unicos), 2) if socios_unicos else 0.0,
                "salidas_registradas": total_salidas,
                "intentos_denegados": accesos_denegados
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Asistencia computada estrictamente como tipoMovimiento=ENTRADA con estadoAcceso=PERMITIDO. Salidas y accesos denegados se reportan como métricas de auditoría separadas sin sumar asistencia.",
            advertencias=[] if filas else ["Sin registros de accesos en el periodo seleccionado."],
            estado=ReportStatus.COMPLETO if filas else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 3: Máquinas averiadas y mantenimientos (reporte_fallas_mantenimiento)
    # =========================================================================
    async def reporte_fallas_mantenimiento(
        self,
        mes: Optional[int] = None,
        anio: Optional[int] = None,
        estado_filtro: Optional[str] = None,
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        fuentes = [SourceCoverage(servicio="ms-inventario", tipo="GraphQL", estado="OK", detalles="mantenimientos y equipos")]

        d_inicio, d_fin, periodo = self._parse_month_year(mes, anio)

        try:
            maintenances = await inventory_adapter.get_all_maintenances()
        except Exception as exc:
            return ReportResult(
                herramienta="reporte_fallas_mantenimiento",
                titulo="Mantenimientos y Estado Operativo de Máquinas",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-inventario", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-inventario inaccesible",
                definicion="Órdenes de mantenimiento correctivo y preventivo.",
                advertencias=[f"Error al consultar ms-inventario: {str(exc)}"],
                estado=ReportStatus.NO_DISPONIBLE
            )

        filas = []
        correctivos = 0
        preventivos = 0
        costo_total = 0.0

        for m in maintenances:
            f_ini_str = m.get("fechaInicio")
            if not f_ini_str:
                continue
            dt_ini = parse_utc(f_ini_str)
            d_ini = to_local_date(dt_ini, settings.DEFAULT_TIMEZONE)

            if d_inicio <= d_ini < d_fin:
                if estado_filtro and m.get("estado") != estado_filtro:
                    continue

                tipo_m = m.get("tipo", "PREVENTIVO")
                if tipo_m == "CORRECTIVO":
                    correctivos += 1
                else:
                    preventivos += 1

                costo = float(m.get("costo") or 0.0)
                costo_total += costo

                eq = m.get("equipo") or {}
                tipo_eq = eq.get("tipoEquipo") or {}

                filas.append({
                    "mantenimiento_id": m["id"],
                    "equipo_codigo": eq.get("codigo", "N/A"),
                    "equipo_nombre": eq.get("nombre", "N/A"),
                    "tipo_equipo": tipo_eq.get("nombre", "General"),
                    "tipo_mantenimiento": tipo_m,
                    "estado": m.get("estado", "PROGRAMADO"),
                    "fecha_inicio": dt_ini.astimezone(self.tz).strftime("%Y-%m-%d %H:%M:%S"),
                    "fecha_fin": m.get("fechaFin"),
                    "descripcion": m.get("descripcion", ""),
                    "costo_bob": costo,
                    "proximo_mantenimiento": m.get("proximoMantenimiento")
                })

        advertencias = []
        advertencias.append("ms-inventario registra órdenes de trabajo de mantenimiento. No se infiere la fecha exacta del evento de avería mecánica a menos que esté documentada en la descripción.")

        return ReportResult(
            herramienta="reporte_fallas_mantenimiento",
            titulo="Reporte de Fallas y Mantenimiento de Máquinas",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% de órdenes de mantenimiento registradas en el inventario",
            totales={
                "total_ordenes_periodo": len(filas),
                "mantenimientos_correctivos_averia": correctivos,
                "mantenimientos_preventivos": preventivos,
                "costo_total_mantenimiento_bob": round(costo_total, 2)
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Órdenes de trabajo preventivas y correctivas iniciadas durante el periodo.",
            advertencias=advertencias,
            estado=ReportStatus.COMPLETO if filas else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 4: Socios inactivos con más de 14 días sin venir (listar_socios_inactivos)
    # =========================================================================
    async def listar_socios_inactivos(
        self,
        dias_inactividad: int = 14,
        sede_id: str = "SEDE-CENTRAL",
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        hoy = self._now_local().date()
        periodo = f"Corte a fecha {hoy.isoformat()} (inactividad calculada para más de {dias_inactividad} días)"
        fuentes = [SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="inscripciones y accesos")]

        try:
            enrollments = await gym_adapter.get_all_enrollments()
            accesses = await gym_adapter.get_all_accesses()
        except Exception as exc:
            return ReportResult(
                herramienta="listar_socios_inactivos",
                titulo="Listado de Socios Activos Inactivos",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-gimnasio inalcanzable",
                definicion="Socios con membresía activa y sin asistencia reciente.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        # Socios con membresía vigente al día de hoy
        socios_activos: Dict[str, Dict[str, Any]] = {}
        for r in enrollments:
            if r.get("estado") == "ACTIVA" and r.get("fechaFin"):
                try:
                    f_fin = date.fromisoformat(r["fechaFin"])
                    if f_fin >= hoy:
                        socios_activos[r["clienteId"]] = r
                except Exception:
                    pass

        # Última visita permitida por socio
        ultima_visita: Dict[str, datetime] = {}
        for a in accesses:
            if a.get("estadoAcceso") == "PERMITIDO" and a.get("tipoMovimiento") == "ENTRADA":
                c_id = a["clienteId"]
                dt = parse_utc(a["fechaHora"])
                if c_id not in ultima_visita or dt > ultima_visita[c_id]:
                    ultima_visita[c_id] = dt

        filas = []
        nunca_asistieron = 0

        for c_id, r in socios_activos.items():
            if c_id in ultima_visita:
                dt_last = ultima_visita[c_id].astimezone(self.tz)
                d_last = dt_last.date()
                dias_sin_venir = (hoy - d_last).days
                if dias_sin_venir > dias_inactividad:
                    filas.append({
                        "cliente_id": c_id,
                        "codigo_matricula": r.get("codigoMatricula", "N/A"),
                        "plan": r.get("plan", {}).get("nombre", "Sin Plan"),
                        "vigencia_fin": r.get("fechaFin"),
                        "dias_sin_asistir": dias_sin_venir,
                        "ultima_asistencia": dt_last.strftime("%Y-%m-%d %H:%M:%S"),
                        "estado_asistencia": "INACTIVO_TEMPORAL",
                        "nunca_asistio": False
                    })
            else:
                # Caso explícito: tiene membresía activa pero NUNCA ha registrado una entrada
                nunca_asistieron += 1
                dt_reg = parse_utc(r["createdAt"]).astimezone(self.tz)
                dias_desde_alta = (hoy - dt_reg.date()).days
                if dias_desde_alta > dias_inactividad:
                    filas.append({
                        "cliente_id": c_id,
                        "codigo_matricula": r.get("codigoMatricula", "N/A"),
                        "plan": r.get("plan", {}).get("nombre", "Sin Plan"),
                        "vigencia_fin": r.get("fechaFin"),
                        "dias_sin_asistir": dias_desde_alta,
                        "ultima_asistencia": "NUNCA_ASISTIO",
                        "estado_asistencia": "NUNCA_ASISTIO",
                        "nunca_asistio": True
                    })

        filas.sort(key=lambda x: x["dias_sin_asistir"], reverse=True)

        return ReportResult(
            herramienta="listar_socios_inactivos",
            titulo=f"Socios con Membresía Vigente e Inactividad Mayor a {dias_inactividad} Días",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% de socios vigentes cotejados contra el registro de torniquetes",
            totales={
                "total_socios_con_membresia_vigente": len(socios_activos),
                "socios_inactivos_reportados": len(filas),
                "socios_que_nunca_asistieron": nunca_asistieron,
                "tasa_inactividad_pct": round((len(filas) / len(socios_activos) * 100), 1) if socios_activos else 0.0
            },
            filas=filas,
            total_filas=len(filas),
            definicion=f"Socios cuya membresía se encuentra activa y vigente hoy, cuya última entrada permitida ocurrió hace más de {dias_inactividad} días naturales, o que nunca registraron una entrada tras su inscripción.",
            advertencias=[] if filas else ["No se detectaron socios inactivos para el umbral seleccionado."],
            estado=ReportStatus.COMPLETO if filas else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 5: Socios con membresía por vencer en 7 días (reporte_membresias_por_vencer)
    # =========================================================================
    async def reporte_membresias_por_vencer(
        self,
        dias_margen: int = 7,
        dias_anticipacion: Optional[int] = None,
        sede_id: str = "SEDE-CENTRAL",
        **kwargs
    ) -> ReportResult:
        if dias_anticipacion is not None:
            dias_margen = dias_anticipacion
        corte = self._now_local().isoformat()
        hoy = self._now_local().date()
        limite = hoy + timedelta(days=dias_margen)
        periodo = f"Desde {hoy.isoformat()} hasta {limite.isoformat()} (próximos {dias_margen} días naturales)"
        fuentes = [SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="inscripcionesPagina")]

        try:
            enrollments = await gym_adapter.get_all_enrollments()
        except Exception as exc:
            return ReportResult(
                herramienta="reporte_membresias_por_vencer",
                titulo="Membresías Próximas a Vencer",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-gimnasio inaccesible",
                definicion="Membresías activas que expiran en la ventana indicada.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        filas = []
        socios_vistos = set()

        for r in enrollments:
            if r.get("estado") == "ACTIVA" and r.get("fechaFin"):
                try:
                    f_fin = date.fromisoformat(r["fechaFin"])
                    if hoy <= f_fin <= limite:
                        c_id = r["clienteId"]
                        dias_restantes = (f_fin - hoy).days
                        socios_vistos.add(c_id)
                        filas.append({
                            "inscripcion_id": r["id"],
                            "codigo_matricula": r.get("codigoMatricula", "N/A"),
                            "cliente_id": c_id,
                            "plan": r.get("plan", {}).get("nombre", "Sin Plan"),
                            "fecha_fin": r["fechaFin"],
                            "dias_restantes": dias_restantes,
                            "disciplina": r.get("disciplina", {}).get("nombre", "Gimnasio Libre")
                        })
                except Exception:
                    pass

        filas.sort(key=lambda x: x["dias_restantes"])

        return ReportResult(
            herramienta="reporte_membresias_por_vencer",
            titulo=f"Membresías Activas por Vencer en los Próximos {dias_margen} Días",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% de inscripciones activas verificadas",
            totales={
                "total_membresias_por_vencer": len(filas),
                "socios_unicos_afectados": len(socios_vistos),
                "vencen_hoy": sum(f["dias_restantes"] == 0 for f in filas),
                "vencen_en_48h": sum(f["dias_restantes"] <= 2 for f in filas)
            },
            filas=filas,
            total_filas=len(filas),
            definicion=f"Membresías en estado ACTIVA cuya fechaFin se encuentra en el rango [{hoy.isoformat()} a {limite.isoformat()}]. Deduplicado por socio.",
            advertencias=[] if filas else [f"No existen membresías que venzan en los próximos {dias_margen} días."],
            estado=ReportStatus.COMPLETO if filas else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 6: Recaudación de hoy por membresías y mostrador (reporte_recaudacion)
    # =========================================================================
    async def reporte_recaudacion(
        self,
        fecha: Optional[str] = None,
        sede_id: str = "SEDE-CENTRAL",
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        hoy = self._now_local().date()
        target_date = date.fromisoformat(fecha) if fecha else hoy
        periodo = f"Fecha efectiva {target_date.isoformat()} (00:00:00 a 23:59:59)"
        fuentes = [
            SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="boletas de pago confirmadas"),
            SourceCoverage(servicio="ventas-mostrador", tipo="REST/DB", estado="NO_CONFIGURADO", detalles="Módulo de tienda no implementado")
        ]

        try:
            enrollments = await gym_adapter.get_all_enrollments()
        except Exception as exc:
            return ReportResult(
                herramienta="reporte_recaudacion",
                titulo="Recaudación y Cobros Efectivos",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="Fuente ms-gimnasio inaccesible",
                definicion="Cobros confirmados con fecha efectiva.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        filas = []
        total_membresias_bob = 0.0

        for r in enrollments:
            pago = r.get("boletaPago")
            if pago and pago.get("estado") == "PAGADO":
                f_pago_str = pago.get("fechaPago") or pago.get("createdAt")
                if f_pago_str:
                    dt_pago = parse_utc(f_pago_str)
                    d_pago = to_local_date(dt_pago, settings.DEFAULT_TIMEZONE)
                    if d_pago == target_date:
                        monto = float(pago.get("montoTotal") or 0.0)
                        total_membresias_bob += monto
                        filas.append({
                            "comprobante": pago.get("numeroComprobante", "N/A"),
                            "origen": "MEMBRESIA",
                            "cliente_id": r["clienteId"],
                            "plan": r.get("plan", {}).get("nombre", "Sin Plan"),
                            "metodo_pago": pago.get("metodoPago", "NO_ESPECIFICADO"),
                            "monto_total_bob": monto,
                            "hora_confirmacion": dt_pago.astimezone(self.tz).strftime("%H:%M:%S")
                        })

        advertencias = [
            "LIMITACIÓN OFICIAL: El resultado es PARCIAL. Solo refleja cobros confirmados de membresías del gimnasio.",
            "No existe en la arquitectura actual un servicio ni base de datos para ventas de mostrador / cafetería / suplementos. No se inventaron registros simulados."
        ]

        return ReportResult(
            herramienta="reporte_recaudacion",
            titulo="Recaudación Efectiva por Membresías y Mostrador",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="PARCIAL (Solo membresías de ms-gimnasio disponibles)",
            totales={
                "recaudacion_total_confirmada_bob": round(total_membresias_bob, 2),
                "recaudacion_membresias_bob": round(total_membresias_bob, 2),
                "recaudacion_mostrador_bob": 0.0,
                "cobertura_mostrador": "NO_IMPLEMENTADO",
                "pagos_confirmados_count": len(filas)
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Cobros en estado PAGADO con fecha de confirmación coincidente con el día evaluado. Pagos pendientes o anulados no se computan como recaudación.",
            advertencias=advertencias,
            estado=ReportStatus.PARCIAL
        )

    # =========================================================================
    # REPORTE 7 y 15: Deuda y Morosidad (reporte_morosidad)
    # =========================================================================
    async def reporte_morosidad(
        self,
        dias_retraso_minimo: int = 0,
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        hoy = self._now_local().date()
        periodo = f"Corte a fecha {hoy.isoformat()} (obligaciones vencidas impagas con retraso > {dias_retraso_minimo} días)"
        fuentes = [SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="inscripciones y boletas de pago")]

        try:
            enrollments = await gym_adapter.get_all_enrollments()
        except Exception as exc:
            return ReportResult(
                herramienta="reporte_morosidad",
                titulo="Reporte de Morosidad y Cuotas Impagas",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-gimnasio inaccesible",
                definicion="Obligaciones de pago vencidas sin confirmación.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        filas = []
        total_deuda = 0.0

        for r in enrollments:
            pago = r.get("boletaPago")
            # Deuda real: boleta existe y se encuentra en estado PENDIENTE
            if pago and pago.get("estado") == "PENDIENTE":
                f_inicio_str = r.get("fechaInicio") or pago.get("createdAt")
                if f_inicio_str:
                    try:
                        f_venc = date.fromisoformat(f_inicio_str[:10])
                        dias_retraso = (hoy - f_venc).days
                        if dias_retraso > dias_retraso_minimo:
                            monto = float(pago.get("montoTotal") or 0.0)
                            total_deuda += monto
                            filas.append({
                                "comprobante": pago.get("numeroComprobante", "PENDIENTE"),
                                "cliente_id": r["clienteId"],
                                "codigo_matricula": r.get("codigoMatricula", "N/A"),
                                "plan": r.get("plan", {}).get("nombre", "Sin Plan"),
                                "fecha_vencimiento_cuota": f_venc.isoformat(),
                                "dias_de_retraso": dias_retraso,
                                "deuda_bob": monto,
                                "metodo_pago_previsto": pago.get("metodoPago", "QR")
                            })
                    except Exception:
                        pass

        filas.sort(key=lambda x: x["dias_de_retraso"], reverse=True)

        advertencias = [
            "Regla de negocio: Una membresía vencida NO se computa automáticamente como deuda o morosidad, a menos que exista una boleta de pago emitida con estado PENDIENTE formalmente no cancelada."
        ]

        return ReportResult(
            herramienta="reporte_morosidad",
            titulo="Reporte de Deuda Total y Socios Morosos",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% de boletas de pago pendientes de liquidación",
            totales={
                "deuda_total_acumulada_bob": round(total_deuda, 2),
                "socios_con_cuotas_impagas": len(set(f["cliente_id"] for f in filas)),
                "total_boletas_en_mora": len(filas),
                "retraso_maximo_dias": max([f["dias_de_retraso"] for f in filas], default=0)
            },
            filas=filas,
            total_filas=len(filas),
            definicion=f"Boletas de inscripción emitidas con estado Pago=PENDIENTE cuya fecha de inicio es anterior a hoy por más de {dias_retraso_minimo} días.",
            advertencias=advertencias,
            estado=ReportStatus.COMPLETO if filas else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 8 y 17: Horas pico y distribución de afluencia (reporte_afluencia)
    # =========================================================================
    async def reporte_afluencia(
        self,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None,
        granularidad: str = "HORA",  # "HORA" o "DIA"
        sede_id: str = "SEDE-CENTRAL",
        tipo_analisis: Optional[str] = None,
        **kwargs
    ) -> ReportResult:
        if tipo_analisis == "MENOR_ASISTENCIA":
            granularidad = "DIA"
        corte = self._now_local().isoformat()
        fuentes = [SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="registrosAccesoPagina")]

        if fecha_inicio and fecha_fin:
            d_inicio = date.fromisoformat(fecha_inicio)
            d_fin = date.fromisoformat(fecha_fin)
            periodo = f"{d_inicio.isoformat()} hasta {d_fin.isoformat()} (inicio inclusivo, fin exclusivo)"
        else:
            # Semana actual por defecto
            hoy = self._now_local().date()
            d_inicio = hoy - timedelta(days=hoy.weekday())  # Lunes
            d_fin = d_inicio + timedelta(days=7)           # Próximo lunes
            periodo = f"Semana del {d_inicio.isoformat()} al {d_fin.isoformat()} (inicio inclusivo, fin exclusivo)"

        try:
            accesses = await gym_adapter.get_all_accesses()
        except Exception as exc:
            return ReportResult(
                herramienta="reporte_afluencia",
                titulo="Distribución de Afluencia y Horas Pico",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-gimnasio inaccesible",
                definicion="Flujo de ingresos por hora o día.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        conteo_por_hora = defaultdict(int)
        conteo_por_dia = defaultdict(int)

        # Inicializar todos los días del periodo en cero para no ocultar días con 0 asistencias
        curr = d_inicio
        while curr < d_fin:
            conteo_por_dia[curr.isoformat()] = 0
            curr += timedelta(days=1)

        # Inicializar las 24 horas del día
        for h in range(24):
            conteo_por_hora[f"{h:02d}:00 - {h+1:02d}:00"] = 0

        total_entradas = 0

        for a in accesses:
            if a.get("estadoAcceso") == "PERMITIDO" and a.get("tipoMovimiento") == "ENTRADA":
                dt_utc = parse_utc(a["fechaHora"])
                dt_local = dt_utc.astimezone(self.tz)
                d_local = dt_local.date()

                if d_inicio <= d_local < d_fin:
                    total_entradas += 1
                    dia_key = d_local.isoformat()
                    hora_key = f"{dt_local.hour:02d}:00 - {dt_local.hour+1:02d}:00"
                    conteo_por_dia[dia_key] += 1
                    conteo_por_hora[hora_key] += 1

        filas = []
        if granularidad.upper() == "HORA":
            for h_label, count in sorted(conteo_por_hora.items(), key=lambda x: x[0]):
                filas.append({
                    "intervalo_horario": h_label,
                    "entradas_registradas": count,
                    "porcentaje_del_total": round((count / total_entradas * 100), 1) if total_entradas else 0.0
                })
            # Ordenar para identificar picos
            pico = max(filas, key=lambda x: x["entradas_registradas"]) if filas else {}
            totales = {
                "total_entradas_periodo": total_entradas,
                "hora_pico_mayor_afluencia": pico.get("intervalo_horario", "N/A"),
                "entradas_en_hora_pico": pico.get("entradas_registradas", 0)
            }
        else:
            for d_label, count in sorted(conteo_por_dia.items(), key=lambda x: x[0]):
                d_obj = date.fromisoformat(d_label)
                filas.append({
                    "fecha": d_label,
                    "dia_semana": d_obj.strftime("%A"),
                    "entradas_registradas": count,
                    "porcentaje_del_total": round((count / total_entradas * 100), 1) if total_entradas else 0.0
                })
            min_dia = min(filas, key=lambda x: x["entradas_registradas"]) if filas else {}
            max_dia = max(filas, key=lambda x: x["entradas_registradas"]) if filas else {}
            totales = {
                "total_entradas_periodo": total_entradas,
                "dia_menor_afluencia": f"{min_dia.get('fecha')} ({min_dia.get('entradas_registradas')} entradas)",
                "dia_mayor_afluencia": f"{max_dia.get('fecha')} ({max_dia.get('entradas_registradas')} entradas)"
            }

        advertencias = [
            "Regla de medición: Las entradas registradas por hora representan tasa de flujo de ingreso a través de torniquetes; no deben interpretarse directamente como ocupación concurrente acumulada de la sala."
        ]

        return ReportResult(
            herramienta="reporte_afluencia",
            titulo="Distribución de Afluencia y Horas Pico de Acceso",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% de entradas por torniquete registradas en la serie temporal",
            totales=totales,
            filas=filas,
            total_filas=len(filas),
            definicion="Conteo de entradas permitidas agrupadas por hora local (00:00 a 23:59) o por día natural.",
            advertencias=advertencias,
            estado=ReportStatus.COMPLETO if total_entradas > 0 else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 9: Clases grupales llenas al 100% (reporte_ocupacion_clases)
    # =========================================================================
    async def reporte_ocupacion_clases(
        self,
        mes: Optional[int] = None,
        anio: Optional[int] = None,
        umbral_porcentaje: float = 100.0,
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        d_inicio, d_fin, periodo = self._parse_month_year(mes, anio)
        fuentes = [SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="disciplinas y horarios")]

        try:
            disciplinas = await gym_adapter.get_disciplines_and_schedules()
        except Exception as exc:
            return ReportResult(
                herramienta="reporte_ocupacion_clases",
                titulo="Ocupación de Clases Grupales al 100%",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-gimnasio inaccesible",
                definicion="Aforo y ocupación de clases.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        filas = []
        llenas_al_100 = 0

        for d in disciplinas:
            cap_max = d.get("capacidadMaxima") or 30
            for dh in d.get("horarios", []):
                cupo_disp = dh.get("cupoDisponible", 0)
                inscritos = max(0, cap_max - cupo_disp)
                pct_ocupacion = round((inscritos / cap_max * 100), 1) if cap_max > 0 else 0.0

                es_100 = (pct_ocupacion >= 100.0 or cupo_disp == 0)
                if es_100:
                    llenas_al_100 += 1

                horario = dh.get("horario") or {}
                filas.append({
                    "disciplina": d["nombre"],
                    "dia_semana": horario.get("diaSemana", "LUNES_A_VIERNES"),
                    "horario": f"{horario.get('horaInicio', '')} - {horario.get('horaFin', '')}",
                    "capacidad_aforo": cap_max,
                    "cupo_disponible": cupo_disp,
                    "socios_inscritos_estimados": inscritos,
                    "porcentaje_ocupacion": pct_ocupacion,
                    "llena_al_100": es_100
                })

        advertencias = [
            "LIMITACIÓN DE DATOS HISTÓRICOS: El porcentaje de ocupación se calcula sobre los cupos asignados y capacidad máxima del catálogo actual de horarios.",
            "ms-gimnasio no registra actualmente el pase de lista individual por cada sesión histórica diaria de clase grupal; solo el aforo del torniquete general."
        ]

        return ReportResult(
            herramienta="reporte_ocupacion_clases",
            titulo="Ocupación de Clases Grupales y Sesiones al 100%",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="PARCIAL (Cupos vigentes en catálogo; sin histórico de asistencia por clase)",
            totales={
                "total_horarios_evaluados": len(filas),
                "clases_con_cupo_agotado_100": llenas_al_100
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Horarios de clases grupales donde el cupo disponible es 0 o la capacidad se encuentra completa según el catálogo de disciplinas.",
            advertencias=advertencias,
            estado=ReportStatus.PARCIAL
        )

    # =========================================================================
    # REPORTE 10: Instructor con más alumnos en clases grupales (ranking_instructores)
    # =========================================================================
    async def ranking_instructores(
        self,
        periodo: str = "mes_actual",
        mes: Optional[int] = None,
        anio: Optional[int] = None,
        top: int = 10,
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        periodo_desc = f"Periodo {periodo} (corte {corte})"
        fuentes = [
            SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="disciplinaHorarios e inscripciones"),
            SourceCoverage(servicio="ms-auth", tipo="REST", estado="OK", detalles="perfiles de instructores")
        ]

        try:
            enrollments = await gym_adapter.get_all_enrollments()
            disciplinas = await gym_adapter.get_disciplines_and_schedules()
            users = await auth_adapter.get_users()
        except Exception as exc:
            return ReportResult(
                herramienta="ranking_instructores",
                titulo="Ranking de Instructores con Más Alumnos",
                periodo_interpretado=periodo_desc,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="Error de comunicación",
                definicion="Alumnos por instructor.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        users_by_id = {u["id"]: f"{u.get('nombre', '')} {u.get('apellido', '')}".strip() for u in users}

        # Conteo de alumnos por instructorId a partir de inscripciones
        alumnos_por_instructor = defaultdict(set)
        for r in enrollments:
            dh = r.get("disciplinaHorario")
            if dh and dh.get("instructorId"):
                inst_id = dh["instructorId"]
                alumnos_por_instructor[inst_id].add(r["clienteId"])

        filas = []
        for inst_id, alumnos_set in alumnos_por_instructor.items():
            nombre_inst = users_by_id.get(inst_id, f"Instructor ({inst_id[:8]})")
            filas.append({
                "instructor_id": inst_id,
                "nombre_instructor": nombre_inst,
                "total_alumnos_unicos": len(alumnos_set)
            })

        filas.sort(key=lambda x: x["total_alumnos_unicos"], reverse=True)

        return ReportResult(
            herramienta="ranking_instructores",
            titulo="Ranking de Instructores con Mayor Número de Alumnos",
            periodo_interpretado=periodo_desc,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% de inscripciones asociadas a disciplinaHorario con instructor asignado",
            totales={
                "total_instructores_con_alumnos": len(filas),
                "instructor_lider": filas[0]["nombre_instructor"] if filas else "N/A",
                "maximo_alumnos": filas[0]["total_alumnos_unicos"] if filas else 0
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Conteo de clientes únicos inscritos en disciplinas asignadas al instructorId.",
            advertencias=[] if filas else ["No hay alumnos asignados a instructores en los registros."],
            estado=ReportStatus.COMPLETO if filas else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 11: Cinco suplementos o bebidas más vendidos (ranking_productos_vendidos)
    # =========================================================================
    async def ranking_productos_vendidos(self, top: int = 5, mes: Optional[int] = None, anio: Optional[int] = None, **kwargs) -> ReportResult:
        corte = self._now_local().isoformat()
        periodo = f"Consulta al corte {corte}"
        return ReportResult(
            herramienta="ranking_productos_vendidos",
            titulo="Top Suplementos y Bebidas Más Vendidos",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=[SourceCoverage(servicio="tienda-pos", tipo="REST", estado="NO_CONFIGURADO", detalles="Módulo de tienda no existe en el ecosistema")],
            cobertura="NO_IMPLEMENTADO",
            totales={},
            filas=[],
            total_filas=0,
            definicion="Ranking de productos consumibles más vendidos.",
            advertencias=[
                "ESTADO NO IMPLEMENTADO: ApexFitness no cuenta actualmente con un módulo de tienda, cafetería, catálogo de suplementos ni registro de ventas de mostrador.",
                "Siguiendo los lineamientos de fidelidad de datos, no se generan datos ficticios ni se reinterpretan movimientos de inventario de máquinas como venta de bebidas."
            ],
            estado=ReportStatus.NO_IMPLEMENTADO
        )

    # =========================================================================
    # REPORTE 12: Productos de tienda con stock bajo (listar_productos_stock_bajo)
    # =========================================================================
    async def listar_productos_stock_bajo(self, umbral_minimo: int = 5, **kwargs) -> ReportResult:
        corte = self._now_local().isoformat()
        periodo = f"Consulta al corte {corte}"
        return ReportResult(
            herramienta="listar_productos_stock_bajo",
            titulo="Productos de Tienda con Stock Bajo",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=[SourceCoverage(servicio="tienda-inventario", tipo="REST", estado="NO_CONFIGURADO", detalles="Solo existe inventario de equipamiento")],
            cobertura="NO_IMPLEMENTADO",
            totales={},
            filas=[],
            total_filas=0,
            definicion="Productos de venta al por menor con existencias inferiores al stock mínimo.",
            advertencias=[
                "ESTADO NO IMPLEMENTADO: El microservicio ms-inventario gestiona exclusivamente máquinas, pesas y equipamiento de sala deportiva.",
                "No existe catálogo de productos consumibles de tienda ni umbrales de stock mínimo de suplementos."
            ],
            estado=ReportStatus.NO_IMPLEMENTADO
        )

    # =========================================================================
    # REPORTE 13: Diez clientes con mejor racha en 3 meses (ranking_rachas_asistencia)
    # =========================================================================
    async def ranking_rachas_asistencia(
        self,
        top: int = 10,
        meses: int = 3,
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        hoy = self._now_local().date()
        d_inicio = hoy - timedelta(days=meses * 30)
        periodo = f"Desde {d_inicio.isoformat()} hasta {hoy.isoformat()} (últimos {meses} meses)"
        fuentes = [SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="registrosAccesoPagina")]

        try:
            accesses = await gym_adapter.get_all_accesses()
        except Exception as exc:
            return ReportResult(
                herramienta="ranking_rachas_asistencia",
                titulo="Ranking de Rachas de Asistencia Consecutiva",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-gimnasio inaccesible",
                definicion="Días consecutivos de entrenamiento.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        # Días únicos de asistencia por socio
        dias_por_socio = defaultdict(set)
        for a in accesses:
            if a.get("estadoAcceso") == "PERMITIDO" and a.get("tipoMovimiento") == "ENTRADA":
                dt_utc = parse_utc(a["fechaHora"])
                d_local = to_local_date(dt_utc, settings.DEFAULT_TIMEZONE)
                if d_inicio <= d_local <= hoy:
                    dias_por_socio[a["clienteId"]].add(d_local)

        ranking = []
        for c_id, dates_set in dias_por_socio.items():
            sorted_dates = sorted(list(dates_set))
            if not sorted_dates:
                continue

            max_streak = 1
            curr_streak = 1
            for i in range(1, len(sorted_dates)):
                if sorted_dates[i] == sorted_dates[i-1] + timedelta(days=1):
                    curr_streak += 1
                    if curr_streak > max_streak:
                        max_streak = curr_streak
                elif sorted_dates[i] > sorted_dates[i-1] + timedelta(days=1):
                    curr_streak = 1

            ranking.append({
                "cliente_id": c_id,
                "dias_consecutivos_maximos": max_streak,
                "total_dias_entrenados": len(dates_set),
                "ultima_asistencia": sorted_dates[-1].isoformat()
            })

        # Desempate por mayor cantidad total de días y fecha más reciente
        ranking.sort(key=lambda x: (x["dias_consecutivos_maximos"], x["total_dias_entrenados"], x["ultima_asistencia"]), reverse=True)
        filas = ranking[:top]

        return ReportResult(
            herramienta="ranking_rachas_asistencia",
            titulo=f"Top {top} Clientes con Mejor Racha de Asistencia ({meses} Meses)",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% de entradas en torniquetes analizadas día a día",
            totales={
                "clientes_evaluados": len(ranking),
                "mejor_racha_dias": filas[0]["dias_consecutivos_maximos"] if filas else 0
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Máximo número de días calendario consecutivos locales (America/La_Paz) con al menos una entrada permitida registrada. Múltiples entradas en un mismo día cuentan como un solo día.",
            advertencias=[] if filas else ["Sin asistencias registradas en la ventana de tiempo."],
            estado=ReportStatus.COMPLETO if filas else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 14: Clientes nuevos de baja o sin renovación (reporte_bajas_no_renovaciones)
    # =========================================================================
    async def reporte_bajas_no_renovaciones(
        self,
        mes: Optional[int] = None,
        anio: Optional[int] = None,
        **kwargs
    ) -> ReportResult:
        hoy = self._now_local().date()
        target_mes = mes or (hoy.month - 1 if hoy.month > 1 else 12)
        target_anio = anio or (hoy.year if hoy.month > 1 else hoy.year - 1)
        corte = self._now_local().isoformat()
        d_inicio, d_fin, periodo = self._parse_month_year(target_mes, target_anio)
        fuentes = [SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="inscripcionesPagina")]

        try:
            enrollments = await gym_adapter.get_all_enrollments()
        except Exception as exc:
            return ReportResult(
                herramienta="reporte_bajas_no_renovaciones",
                titulo="Reporte de Clientes Nuevos Sin Renovación",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-gimnasio inaccesible",
                definicion="Clientes sin continuidad contractual.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        # Determinar fecha de primera inscripción de cada cliente
        cliente_primera_fecha = {}
        inscripciones_por_cliente = defaultdict(list)
        for r in enrollments:
            c_id = r["clienteId"]
            dt_created = parse_utc(r["createdAt"])
            inscripciones_por_cliente[c_id].append(r)
            if c_id not in cliente_primera_fecha or dt_created < cliente_primera_fecha[c_id]:
                cliente_primera_fecha[c_id] = dt_created

        filas = []
        for c_id, r_list in inscripciones_por_cliente.items():
            dt_primera = cliente_primera_fecha[c_id]
            d_primera = to_local_date(dt_primera, settings.DEFAULT_TIMEZONE)

            # Cliente NUEVO que se inscribió en el mes analizado
            if d_inicio <= d_primera < d_fin:
                # Verificar si su membresía ya venció o fue cancelada y no tiene inscripciones posteriores
                r_activas_o_posteriores = [
                    x for x in r_list if x.get("estado") == "ACTIVA" or parse_utc(x["createdAt"]) > dt_primera + timedelta(days=25)
                ]
                if not r_activas_o_posteriores:
                    ultima_ins = max(r_list, key=lambda x: parse_utc(x["createdAt"]))
                    filas.append({
                        "cliente_id": c_id,
                        "codigo_matricula": ultima_ins.get("codigoMatricula", "N/A"),
                        "plan_inicial": ultima_ins.get("plan", {}).get("nombre", "Sin Plan"),
                        "fecha_inscripcion": dt_primera.strftime("%Y-%m-%d"),
                        "fecha_fin_contrato": ultima_ins.get("fechaFin"),
                        "motivo_baja": "Vencida sin renovación registrada"
                    })

        return ReportResult(
            herramienta="reporte_bajas_no_renovaciones",
            titulo=f"Clientes Nuevos de Baja o Sin Renovación (Mes {target_mes:02d}/{target_anio})",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% del histórico de contratos analizado por cohorte de ingreso",
            totales={
                "socios_nuevos_sin_renovacion": len(filas)
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Clientes cuya primera membresía en el club comenzó en el mes indicado, pero cuyo contrato expiró y no registraron renovación posterior.",
            advertencias=[] if filas else ["No se identificaron socios nuevos sin renovación para esta cohorte."],
            estado=ReportStatus.COMPLETO if filas else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 16: Socios que completaron su rutina esta semana (reporte_cumplimiento_rutinas)
    # =========================================================================
    async def reporte_cumplimiento_rutinas(
        self,
        semana: str = "actual",
        top: int = 20,
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        periodo = f"Semana {semana} (corte a {corte})"
        fuentes = [SourceCoverage(servicio="ms-entrenamiento", tipo="GraphQL", estado="OK", detalles="planesEntrenamiento")]

        try:
            planes = await training_adapter.get_training_plans()
        except Exception as exc:
            return ReportResult(
                herramienta="reporte_cumplimiento_rutinas",
                titulo="Cumplimiento de Rutinas de Entrenamiento",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-entrenamiento", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-entrenamiento inaccesible",
                definicion="Seguimiento de ejercicios completados.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        filas = []
        for p in planes:
            if p.get("estado"):
                rutinas = p.get("rutinasProgramadas", [])
                filas.append({
                    "plan_id": p["id"],
                    "usuario_id": p.get("idUsuario"),
                    "plan_nombre": p.get("nombre"),
                    "objetivo": p.get("objetivo"),
                    "rutinas_programadas_total": len(rutinas),
                    "estado_ejecucion": "NO_DISPONIBLE_LOG_SESION"
                })

        advertencias = [
            "LIMITACIÓN OFICIAL: El microservicio ms-entrenamiento gestiona planes y rutinas prescritas por instructores.",
            "No existe en la base de datos operativa un registro de telemetría de máquinas ni bitácora de series completadas por sesión para verificar la ejecución real en sala."
        ]

        return ReportResult(
            herramienta="reporte_cumplimiento_rutinas",
            titulo="Cumplimiento de Rutinas Asignadas",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="PARCIAL (Planes asignados disponibles; telemetría de ejecución ausente)",
            totales={
                "planes_activos_asignados": len(filas),
                "cumplimiento_verificable": "NO_REGISTRADO"
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Planes de entrenamiento asignados vigentes. La confirmación de si el socio completó cada ejercicio no se almacena en la base de datos.",
            advertencias=advertencias,
            estado=ReportStatus.PARCIAL
        )

    # =========================================================================
    # REPORTE 19: Máquinas de cardio con más fallas en el año (ranking_fallas_equipos)
    # =========================================================================
    async def ranking_fallas_equipos(
        self,
        anio: Optional[int] = None,
        categoria: str = "cardio",
        top: int = 10,
        **kwargs
    ) -> ReportResult:
        target_anio = anio or self._now_local().year
        corte = self._now_local().isoformat()
        periodo = f"Año {target_anio} completo (01 de enero a 31 de diciembre)"
        fuentes = [SourceCoverage(servicio="ms-inventario", tipo="GraphQL", estado="OK", detalles="mantenimientos y equipos")]

        try:
            maintenances = await inventory_adapter.get_all_maintenances()
        except Exception as exc:
            return ReportResult(
                herramienta="ranking_fallas_equipos",
                titulo="Ranking de Fallas en Equipos y Máquinas",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-inventario", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-inventario inaccesible",
                definicion="Mantenimientos correctivos por equipo.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        palabras_cardio = {"cardio", "caminadora", "treadmill", "bicicleta", "eliptica", "spinning", "remo"}
        fallas_por_equipo = defaultdict(lambda: {"nombre": "", "codigo": "", "tipo": "", "fallas": 0, "costo_total": 0.0})

        for m in maintenances:
            if m.get("tipo") == "CORRECTIVO":
                f_ini = m.get("fechaInicio", "")
                if f_ini and f_ini.startswith(str(anio)):
                    eq = m.get("equipo") or {}
                    t_eq = (eq.get("tipoEquipo") or {}).get("nombre", "").lower()
                    nom_eq = eq.get("nombre", "").lower()

                    es_cardio = any(p in t_eq or p in nom_eq for p in palabras_cardio) if categoria == "cardio" else True

                    if es_cardio:
                        eq_id = eq.get("id", "DESCONOCIDO")
                        fallas_por_equipo[eq_id]["nombre"] = eq.get("nombre", "Sin Nombre")
                        fallas_por_equipo[eq_id]["codigo"] = eq.get("codigo", "S/C")
                        fallas_por_equipo[eq_id]["tipo"] = (eq.get("tipoEquipo") or {}).get("nombre", "Cardio")
                        fallas_por_equipo[eq_id]["fallas"] += 1
                        fallas_por_equipo[eq_id]["costo_total"] += float(m.get("costo") or 0.0)

        filas = list(fallas_por_equipo.values())
        filas.sort(key=lambda x: x["fallas"], reverse=True)

        return ReportResult(
            herramienta="ranking_fallas_equipos",
            titulo=f"Máquinas de {categoria.capitalize()} con Más Fallas y Mantenimientos Correctivos ({anio})",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="100% de órdenes de mantenimiento correctivo del año",
            totales={
                "equipos_afectados_por_fallas": len(filas),
                "total_fallas_correctivas": sum(f["fallas"] for f in filas),
                "gasto_total_reparaciones_bob": round(sum(f["costo_total"] for f in filas), 2)
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Equipos del catálogo filtrados por categoría que registraron órdenes de tipo CORRECTIVO iniciadas en el año indicado.",
            advertencias=[] if filas else [f"No se registraron fallas de mantenimiento correctivo para la categoría '{categoria}' en el año {anio}."],
            estado=ReportStatus.COMPLETO if filas else ReportStatus.SIN_DATOS
        )

    # =========================================================================
    # REPORTE 20: Comparación de ingresos este mes vs anterior (comparar_ingresos)
    # =========================================================================
    async def comparar_ingresos(
        self,
        mes1: Optional[int] = None,
        mes2: Optional[int] = None,
        anio: Optional[int] = None,
        mes_actual: Optional[int] = None,
        anio_actual: Optional[int] = None,
        **kwargs
    ) -> ReportResult:
        corte = self._now_local().isoformat()
        hoy = self._now_local().date()

        target_anio = anio_actual or anio or hoy.year
        # Por defecto mes1 = mes anterior, mes2 = mes actual
        m2 = mes_actual or mes2 or hoy.month
        m1 = mes1 or (12 if m2 == 1 else m2 - 1)
        a1 = target_anio - 1 if (mes1 is None and m2 == 1) else target_anio

        d1_ini, d1_fin, p1_desc = self._parse_month_year(m1, a1)
        d2_ini, d2_fin, p2_desc = self._parse_month_year(m2, anio)

        periodo = f"Comparación Mes A ({p1_desc}) vs Mes B ({p2_desc})"
        fuentes = [SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="OK", detalles="boletas de pago confirmadas")]

        try:
            enrollments = await gym_adapter.get_all_enrollments()
        except Exception as exc:
            return ReportResult(
                herramienta="comparar_ingresos",
                titulo="Comparación de Ingresos Mensuales",
                periodo_interpretado=periodo,
                fecha_corte=corte,
                fuentes_consultadas=[SourceCoverage(servicio="ms-gimnasio", tipo="GraphQL", estado="FALLIDO", detalles=str(exc))],
                cobertura="ms-gimnasio inaccesible",
                definicion="Comparación de ingresos confirmados.",
                advertencias=[str(exc)],
                estado=ReportStatus.NO_DISPONIBLE
            )

        ingresos_m1 = 0.0
        ingresos_m2 = 0.0
        pagos_m1 = 0
        pagos_m2 = 0

        for r in enrollments:
            pago = r.get("boletaPago")
            if pago and pago.get("estado") == "PAGADO":
                f_pago = pago.get("fechaPago") or pago.get("createdAt")
                if f_pago:
                    dt = parse_utc(f_pago)
                    d_local = to_local_date(dt, settings.DEFAULT_TIMEZONE)
                    monto = float(pago.get("montoTotal") or 0.0)

                    if d1_ini <= d_local < d1_fin:
                        ingresos_m1 += monto
                        pagos_m1 += 1
                    elif d2_ini <= d_local < d2_fin:
                        ingresos_m2 += monto
                        pagos_m2 += 1

        diferencia = round(ingresos_m2 - ingresos_m1, 2)
        variacion_pct = round((diferencia / ingresos_m1 * 100), 1) if ingresos_m1 > 0 else 0.0

        filas = [
            {
                "periodo": f"Mes A ({m1:02d}/{a1})",
                "ingresos_confirmados_bob": round(ingresos_m1, 2),
                "cantidad_pagos": pagos_m1
            },
            {
                "periodo": f"Mes B ({m2:02d}/{anio})",
                "ingresos_confirmados_bob": round(ingresos_m2, 2),
                "cantidad_pagos": pagos_m2
            }
        ]

        advertencias = [
            "LIMITACIÓN OFICIAL: Los ingresos comparados corresponden exclusivamente a cobros de membresías e inscripciones confirmados en ms-gimnasio.",
            "No se incluyen ventas de cafetería ni mostrador por falta de módulo operativo en el ecosistema."
        ]

        return ReportResult(
            herramienta="comparar_ingresos",
            titulo=f"Comparación de Ingresos: Mes {m1:02d} vs Mes {m2:02d}",
            periodo_interpretado=periodo,
            fecha_corte=corte,
            fuentes_consultadas=fuentes,
            cobertura="PARCIAL (Ingresos de membresías completos; sin ventas de mostrador)",
            totales={
                "ingresos_mes_anterior_bob": round(ingresos_m1, 2),
                "ingresos_mes_actual_bob": round(ingresos_m2, 2),
                "variacion_absoluta_bob": diferencia,
                "variacion_porcentual_pct": variacion_pct,
                "tendencia": "CRECIMIENTO" if diferencia > 0 else ("DESCENSO" if diferencia < 0 else "SIN_CAMBIOS")
            },
            filas=filas,
            total_filas=len(filas),
            definicion="Comparación de sumas de importes netos en boletas de pago PAGADO con fecha de confirmación en cada mes.",
            advertencias=advertencias,
            estado=ReportStatus.PARCIAL
        )

    # =========================================================================
    # MATRIZ DE CAPACIDADES DE REPORTES (obtener_capacidades_reportes)
    # =========================================================================
    def obtener_capacidades_reportes(self) -> Dict[str, Any]:
        return {
            "servidor_mcp": "ApexFitness Intelligence Reports MCP",
            "version": "1.0.0",
            "zona_horaria": settings.DEFAULT_TIMEZONE,
            "total_herramientas": 17,
            "preguntas_de_negocio_cubiertas": 20,
            "herramientas": [
                {
                    "nombre": "listar_inscripciones",
                    "pregunta_reporte": 1,
                    "descripcion": "Clientes inscritos en el último mes o periodo personalizado.",
                    "fuente": "ms-gimnasio",
                    "cobertura": "COMPLETO",
                    "scopes": ["membresias"]
                },
                {
                    "nombre": "reporte_asistencias",
                    "pregunta_reporte": [2, 18],
                    "descripcion": "Asistencias por periodo o franja horaria (ej. 06:00 a 09:00).",
                    "fuente": "ms-gimnasio",
                    "cobertura": "COMPLETO",
                    "scopes": ["asistencia"]
                },
                {
                    "nombre": "reporte_fallas_mantenimiento",
                    "pregunta_reporte": 3,
                    "descripcion": "Máquinas averiadas y mantenimientos previstos.",
                    "fuente": "ms-inventario",
                    "cobertura": "COMPLETO",
                    "scopes": ["inventario"]
                },
                {
                    "nombre": "listar_socios_inactivos",
                    "pregunta_reporte": 4,
                    "descripcion": "Socios con membresía activa sin asistir hace más de 14 días.",
                    "fuente": "ms-gimnasio",
                    "cobertura": "COMPLETO",
                    "scopes": ["asistencia", "membresias"]
                },
                {
                    "nombre": "reporte_membresias_por_vencer",
                    "pregunta_reporte": 5,
                    "descripcion": "Socios con membresía que expira en los próximos días.",
                    "fuente": "ms-gimnasio",
                    "cobertura": "COMPLETO",
                    "scopes": ["membresias"]
                },
                {
                    "nombre": "reporte_recaudacion",
                    "pregunta_reporte": 6,
                    "descripcion": "Recaudación de hoy/fecha por membresías y mostrador.",
                    "fuente": "ms-gimnasio (membresías) / tienda ausente",
                    "cobertura": "PARCIAL",
                    "scopes": ["finanzas"]
                },
                {
                    "nombre": "reporte_morosidad",
                    "pregunta_reporte": [7, 15],
                    "descripcion": "Deuda de socios y cuotas impagas con más de 15 días de retraso.",
                    "fuente": "ms-gimnasio",
                    "cobertura": "COMPLETO",
                    "scopes": ["finanzas"]
                },
                {
                    "nombre": "reporte_afluencia",
                    "pregunta_reporte": [8, 17],
                    "descripcion": "Horas pico de la semana o día del mes con menor asistencia.",
                    "fuente": "ms-gimnasio",
                    "cobertura": "COMPLETO",
                    "scopes": ["asistencia"]
                },
                {
                    "nombre": "reporte_ocupacion_clases",
                    "pregunta_reporte": 9,
                    "descripcion": "Clases grupales llenas al 100% (según cupo de catálogo).",
                    "fuente": "ms-gimnasio",
                    "cobertura": "PARCIAL",
                    "scopes": ["asistencia"]
                },
                {
                    "nombre": "ranking_instructores",
                    "pregunta_reporte": 10,
                    "descripcion": "Instructor con mayor cantidad de alumnos en disciplinas.",
                    "fuente": "ms-gimnasio / ms-auth",
                    "cobertura": "COMPLETO",
                    "scopes": ["identidades", "asistencia"]
                },
                {
                    "nombre": "ranking_productos_vendidos",
                    "pregunta_reporte": 11,
                    "descripcion": "Suplementos y bebidas más vendidos.",
                    "fuente": "tienda ausente",
                    "cobertura": "NO_IMPLEMENTADO",
                    "scopes": ["inventario"]
                },
                {
                    "nombre": "listar_productos_stock_bajo",
                    "pregunta_reporte": 12,
                    "descripcion": "Productos de tienda con stock bajo.",
                    "fuente": "tienda ausente",
                    "cobertura": "NO_IMPLEMENTADO",
                    "scopes": ["inventario"]
                },
                {
                    "nombre": "ranking_rachas_asistencia",
                    "pregunta_reporte": 13,
                    "descripcion": "Clientes con mejor racha de asistencia consecutiva.",
                    "fuente": "ms-gimnasio",
                    "cobertura": "COMPLETO",
                    "scopes": ["asistencia"]
                },
                {
                    "nombre": "reporte_bajas_no_renovaciones",
                    "pregunta_reporte": 14,
                    "descripcion": "Clientes nuevos que no renovaron su contrato.",
                    "fuente": "ms-gimnasio",
                    "cobertura": "COMPLETO",
                    "scopes": ["membresias"]
                },
                {
                    "nombre": "reporte_cumplimiento_rutinas",
                    "pregunta_reporte": 16,
                    "descripcion": "Socios con rutinas asignadas y seguimiento de ejercicios.",
                    "fuente": "ms-entrenamiento",
                    "cobertura": "PARCIAL",
                    "scopes": ["entrenamiento"]
                },
                {
                    "nombre": "ranking_fallas_equipos",
                    "pregunta_reporte": 19,
                    "descripcion": "Máquinas de cardio con más fallas en el año.",
                    "fuente": "ms-inventario",
                    "cobertura": "COMPLETO",
                    "scopes": ["inventario"]
                },
                {
                    "nombre": "comparar_ingresos",
                    "pregunta_reporte": 20,
                    "descripcion": "Comparación de ingresos mes actual vs mes anterior.",
                    "fuente": "ms-gimnasio",
                    "cobertura": "PARCIAL",
                    "scopes": ["finanzas"]
                }
            ]
        }

reports_service = ReportsService()

