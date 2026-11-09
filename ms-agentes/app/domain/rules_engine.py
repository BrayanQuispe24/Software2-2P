from typing import Optional, List, Tuple
import uuid
from datetime import datetime, timezone

from .entities import (
    ReglaMonitoreo,
    IndicadorNegocio,
    Anomalia,
    Alerta,
    SeveridadAlerta,
    EstadoAlerta,
    NivelAutonomia,
    AccionAgente,
    EstadoAccion,
    TipoAgente,
)

class RulesEngine:
    """
    Motor de reglas determinístico para el Agente Inteligente de ApexFitness.
    Aplica evaluación de umbrales, deduplicación, histéresis y control estricto de autonomía.
    """

    @staticmethod
    def evaluar_indicador(
        regla: ReglaMonitoreo,
        indicador: IndicadorNegocio
    ) -> Tuple[Optional[Anomalia], Optional[str]]:
        """
        Determina si un indicador supera umbrales preventivos o críticos.
        Retorna (Anomalia, condicion_activadora) o (None, None).
        """
        if not regla.activa or not indicador.confiable:
            return None, None

        valor = indicador.valor_actual
        ref = indicador.valor_referencia

        # Caso 1: Reglas de Umbral Máximo Superior (ej. Aforo %: 90% preventivo, 100% crítico)
        if regla.agente_tipo in [TipoAgente.AFORO, TipoAgente.RETENCION, TipoAgente.SEGUIMIENTO]:
            if valor >= regla.umbral_critico:
                return (
                    Anomalia(
                        id=str(uuid.uuid4()),
                        regla_id=regla.id,
                        agente_tipo=regla.agente_tipo,
                        sede_id=regla.sede_id,
                        indicador_clave=regla.indicador_clave,
                        valor_observado=valor,
                        valor_referencia=ref,
                        severidad=SeveridadAlerta.CRITICA,
                        grado_confianza=1.0 if indicador.confiable else 0.8,
                        descripcion=f"El indicador {regla.indicador_clave} ({valor}{indicador.unidad}) superó el umbral crítico de {regla.umbral_critico}{indicador.unidad}.",
                        metadata=indicador.metadata
                    ),
                    f"{regla.indicador_clave} >= {regla.umbral_critico}{indicador.unidad}"
                )
            elif valor >= regla.umbral_preventivo:
                return (
                    Anomalia(
                        id=str(uuid.uuid4()),
                        regla_id=regla.id,
                        agente_tipo=regla.agente_tipo,
                        sede_id=regla.sede_id,
                        indicador_clave=regla.indicador_clave,
                        valor_observado=valor,
                        valor_referencia=ref,
                        severidad=SeveridadAlerta.PREVENTIVA,
                        grado_confianza=1.0 if indicador.confiable else 0.8,
                        descripcion=f"El indicador {regla.indicador_clave} ({valor}{indicador.unidad}) superó el umbral preventivo de {regla.umbral_preventivo}{indicador.unidad}.",
                        metadata=indicador.metadata
                    ),
                    f"{regla.indicador_clave} >= {regla.umbral_preventivo}{indicador.unidad}"
                )

        # Caso 2: Reglas de Umbral Mínimo o Caída Porcentual (ej. Disponibilidad Equipos %, Caída Matrículas %)
        elif regla.agente_tipo in [TipoAgente.COMERCIAL, TipoAgente.OPERATIVO]:
            # Si el umbral crítico es menor que el preventivo (ej. disponibilidad < 45% crítico, < 60% preventivo)
            # O caídas porcentuales negativas (ej. -30% crítico, -20% preventivo)
            if valor <= regla.umbral_critico:
                return (
                    Anomalia(
                        id=str(uuid.uuid4()),
                        regla_id=regla.id,
                        agente_tipo=regla.agente_tipo,
                        sede_id=regla.sede_id,
                        indicador_clave=regla.indicador_clave,
                        valor_observado=valor,
                        valor_referencia=ref,
                        severidad=SeveridadAlerta.ALTA if regla.agente_tipo == TipoAgente.COMERCIAL else SeveridadAlerta.CRITICA,
                        grado_confianza=1.0 if indicador.confiable else 0.85,
                        descripcion=f"El indicador {regla.indicador_clave} ({valor}{indicador.unidad}) cayó por debajo del límite crítico de {regla.umbral_critico}{indicador.unidad}.",
                        metadata=indicador.metadata
                    ),
                    f"{regla.indicador_clave} <= {regla.umbral_critico}{indicador.unidad}"
                )
            elif valor <= regla.umbral_preventivo:
                return (
                    Anomalia(
                        id=str(uuid.uuid4()),
                        regla_id=regla.id,
                        agente_tipo=regla.agente_tipo,
                        sede_id=regla.sede_id,
                        indicador_clave=regla.indicador_clave,
                        valor_observado=valor,
                        valor_referencia=ref,
                        severidad=SeveridadAlerta.MEDIA if regla.agente_tipo == TipoAgente.COMERCIAL else SeveridadAlerta.PREVENTIVA,
                        grado_confianza=1.0 if indicador.confiable else 0.85,
                        descripcion=f"El indicador {regla.indicador_clave} ({valor}{indicador.unidad}) cruzó el umbral preventivo de {regla.umbral_preventivo}{indicador.unidad}.",
                        metadata=indicador.metadata
                    ),
                    f"{regla.indicador_clave} <= {regla.umbral_preventivo}{indicador.unidad}"
                )

        return None, None

    @staticmethod
    def procesar_alerta_con_deduplicacion(
        regla: ReglaMonitoreo,
        anomalia: Optional[Anomalia],
        indicador: IndicadorNegocio,
        alerta_existente: Optional[Alerta]
    ) -> Tuple[Optional[Alerta], str, Optional[AccionAgente]]:
        """
        Aplica deduplicación, histéresis de cierre y escalamiento sin crear duplicados.
        Retorna (AlertaResultante, accion_tomada, AccionAgenteOpcional)
        accion_tomada puede ser: 'CREADA', 'ESCALADA', 'COOLDOWN_IGNORADA', 'RESUELTA_POR_HISTERESIS', 'SIN_CAMBIOS'
        """
        now = datetime.now(timezone.utc)
        if not indicador.confiable:
            return None, "SIN_CAMBIOS", None

        if alerta_existente and anomalia:
            alerta_existente.titulo = RulesEngine.generar_titulo(regla, anomalia)
            alerta_existente.condicion_activadora = f"{indicador.nombre} = {anomalia.valor_observado:g}{indicador.unidad}"
            alerta_existente.evidencia_json = {
                "indicador": indicador.nombre,
                "valor_observado": anomalia.valor_observado,
                "valor_referencia": anomalia.valor_referencia,
                "unidad": indicador.unidad,
                "umbrales": {"preventivo": regla.umbral_preventivo, "critico": regla.umbral_critico, "cierre": regla.umbral_cierre_histeresis},
                "metadata": indicador.metadata,
            }
            alerta_existente.valor_referencia = anomalia.valor_referencia
            alerta_existente.explicacion = anomalia.descripcion
            alerta_existente.origen_explicacion = "DETERMINISTICO"
            alerta_existente.modelo_ia_browser = None

        # 1. Caso de Resolución por Histéresis:
        # Si había una alerta abierta pero ahora el indicador está por debajo del umbral de cierre
        if alerta_existente and alerta_existente.estado not in [EstadoAlerta.RESUELTA]:
            if regla.umbral_cierre_histeresis is not None:
                # Para indicadores superiores (Aforo): si baja del umbral de histéresis (ej. < 85%)
                if regla.agente_tipo in [TipoAgente.AFORO, TipoAgente.RETENCION] and indicador.valor_actual < regla.umbral_cierre_histeresis:
                    alerta_existente.estado = EstadoAlerta.RESUELTA
                    alerta_existente.resolved_at = now
                    alerta_existente.updated_at = now
                    alerta_existente.explicacion += f" | Situación normalizada: el valor ({indicador.valor_actual}{indicador.unidad}) descendió del umbral de histéresis ({regla.umbral_cierre_histeresis}{indicador.unidad})."
                    return alerta_existente, "RESUELTA_POR_HISTERESIS", None
                # Para indicadores inferiores (Disponibilidad): si sube por encima del umbral de histéresis (ej. > 80%)
                elif regla.agente_tipo in [TipoAgente.OPERATIVO] and indicador.valor_actual > regla.umbral_cierre_histeresis:
                    alerta_existente.estado = EstadoAlerta.RESUELTA
                    alerta_existente.resolved_at = now
                    alerta_existente.updated_at = now
                    alerta_existente.explicacion += f" | Equipos restablecidos: disponibilidad subió a {indicador.valor_actual}{indicador.unidad} superando {regla.umbral_cierre_histeresis}{indicador.unidad}."
                    return alerta_existente, "RESUELTA_POR_HISTERESIS", None

        # Si no hubo anomalía detectada y no aplica resolución, retornar sin cambios
        if not anomalia:
            return None, "SIN_CAMBIOS", None

        # 2. Si ya existe alerta abierta para esta regla en esta sede:
        if alerta_existente and alerta_existente.estado not in [EstadoAlerta.RESUELTA]:
            severidades_orden = {
                SeveridadAlerta.INFORMATIVA: 1,
                SeveridadAlerta.PREVENTIVA: 2,
                SeveridadAlerta.MEDIA: 3,
                SeveridadAlerta.ALTA: 4,
                SeveridadAlerta.CRITICA: 5,
            }

            sev_actual = severidades_orden.get(alerta_existente.severidad, 1)
            sev_nueva = severidades_orden.get(anomalia.severidad, 1)

            # Si la severidad aumenta (ej. de 92% Preventiva a 100% Crítica) -> ESCALAMIENTO SIN DUPLICADO
            if sev_nueva > sev_actual:
                alerta_existente.severidad = anomalia.severidad
                alerta_existente.valor_observado = anomalia.valor_observado
                alerta_existente.condicion_activadora = f"{indicador.nombre} = {anomalia.valor_observado:g}{indicador.unidad} (Severidad {anomalia.severidad.value})"
                alerta_existente.contador_ocurrencias += 1
                alerta_existente.updated_at = now
                alerta_existente.estado = EstadoAlerta.ESCALADA
                alerta_existente.explicacion = (
                    f"ESCALAMIENTO: {anomalia.descripcion} "
                    f"La ocupación o desviación aumentó respecto a la evaluación inicial ({alerta_existente.valor_referencia or 'referencia'})."
                )
                alerta_existente.recomendacion = RulesEngine.generar_recomendacion_base(regla, anomalia, indicador)
                alerta_existente.evidencia_json = {
                    "indicador": indicador.nombre,
                    "valor_observado": anomalia.valor_observado,
                    "valor_referencia": anomalia.valor_referencia,
                    "unidad": indicador.unidad,
                    "umbrales": {"preventivo": regla.umbral_preventivo, "critico": regla.umbral_critico, "cierre": regla.umbral_cierre_histeresis},
                "metadata": indicador.metadata,
                    "escalado": True
                }

                accion = RulesEngine.determinar_accion(regla, alerta_existente)
                return alerta_existente, "ESCALADA", accion

            # Si la severidad es igual o menor, entra en COOLDOWN para evitar spam repetido
            ultima_accion = alerta_existente.ultima_notificacion_at or alerta_existente.created_at
            delta_seg = (now - ultima_accion.replace(tzinfo=ultima_accion.tzinfo or timezone.utc)).total_seconds()
            if delta_seg < regla.cooldown_seg:
                alerta_existente.contador_ocurrencias += 1
                alerta_existente.valor_observado = anomalia.valor_observado
                alerta_existente.updated_at = now
                return alerta_existente, "COOLDOWN_IGNORADA", None

            # Si pasó el cooldown, se refrescan datos pero sin crear nueva alerta
            alerta_existente.contador_ocurrencias += 1
            alerta_existente.valor_observado = anomalia.valor_observado
            alerta_existente.updated_at = now
            accion = RulesEngine.determinar_accion(regla, alerta_existente)
            return alerta_existente, "ACTUALIZADA_POST_COOLDOWN", accion

        # 3. No existe alerta abierta previa -> CREAR NUEVA ALERTA
        nueva_alerta = Alerta(
            id=str(uuid.uuid4()),
            regla_id=regla.id,
            agente_tipo=regla.agente_tipo,
            sede_id=regla.sede_id,
            titulo=RulesEngine.generar_titulo(regla, anomalia),
            severidad=anomalia.severidad,
            estado=EstadoAlerta.DETECTADA,
            valor_observado=anomalia.valor_observado,
            valor_referencia=anomalia.valor_referencia,
            condicion_activadora=f"{indicador.nombre} = {anomalia.valor_observado:g}{indicador.unidad}",
            explicacion=anomalia.descripcion,
            recomendacion=RulesEngine.generar_recomendacion_base(regla, anomalia, indicador),
            origen_explicacion="DETERMINISTICO",
            grado_confianza=anomalia.grado_confianza,
            contador_ocurrencias=1,
            evidencia_json={
                "indicador": indicador.nombre,
                "valor_observado": anomalia.valor_observado,
                "valor_referencia": anomalia.valor_referencia,
                "unidad": indicador.unidad,
                "umbrales": {"preventivo": regla.umbral_preventivo, "critico": regla.umbral_critico, "cierre": regla.umbral_cierre_histeresis},
                "metadata": indicador.metadata
            },
            created_at=now,
            updated_at=now
        )

        accion = RulesEngine.determinar_accion(regla, nueva_alerta)
        return nueva_alerta, "CREADA", accion

    @staticmethod
    def generar_titulo(regla: ReglaMonitoreo, anomalia: Anomalia) -> str:
        if regla.agente_tipo == TipoAgente.AFORO:
            return f"Ocupación Elevada ({anomalia.valor_observado}%) en {regla.sede_id}"
        elif regla.agente_tipo == TipoAgente.COMERCIAL:
            return f"Descenso de Nuevas Matrículas ({anomalia.valor_observado}%)"
        elif regla.agente_tipo == TipoAgente.RETENCION:
            if anomalia.metadata.get("metodo") == "REGLA_INACTIVIDAD":
                return f"Clientes con Inactividad Prolongada ({anomalia.valor_observado}%)"
            return f"Clientes con Alto Riesgo de Abandono ({anomalia.valor_observado}%)"
        elif regla.agente_tipo == TipoAgente.OPERATIVO:
            return f"Disponibilidad Reducida de Equipos ({anomalia.valor_observado}%)"
        elif regla.agente_tipo == TipoAgente.SEGUIMIENTO:
            return f"Alerta sin atención requiere escalamiento inmediato"
        return f"Anomalía detectada en {regla.indicador_clave}"

    @staticmethod
    def generar_recomendacion_base(
        regla: ReglaMonitoreo,
        anomalia: Anomalia,
        indicador: IndicadorNegocio
    ) -> str:
        if regla.agente_tipo == TipoAgente.AFORO:
            if anomalia.severidad == SeveridadAlerta.CRITICA:
                return "Aplicar políticas de aforo máximo en recepción. Detener ingresos temporales o redistribuir socios a áreas complementarias."
            return "Monitorear afluencia preventiva en el próximo intervalo. Revisar distribución de socios entre salas."
        elif regla.agente_tipo == TipoAgente.COMERCIAL:
            return "Revisar las campañas comerciales vigentes, horarios disponibles y canales de captación. No asumir una única causa sin contrastar con satisfacción y precios."
        elif regla.agente_tipo == TipoAgente.RETENCION:
            return "Evaluar plan de fidelización y contactar proactivamente a usuarios con señales de deserción mediante canales de retención autorizados."
        elif regla.agente_tipo == TipoAgente.OPERATIVO:
            return "Revisar órdenes de mantenimiento preventivo y correctivo en ms-inventario para acelerar la puesta en servicio de las unidades críticas."
        elif regla.agente_tipo == TipoAgente.SEGUIMIENTO:
            return "Asignar responsable operativo de forma manual y elevar notificación al supervisor de turno."
        return "Revisar el estado del servicio correspondiente."

    @staticmethod
    def determinar_accion(regla: ReglaMonitoreo, alerta: Alerta) -> Optional[AccionAgente]:
        """
        Determina qué acción ejecutar según el Nivel de Autonomía configurado (0 a 4).
        Nivel 0: Ninguna acción adicional (solo persistencia).
        Nivel 1: Registro interno / alerta visible.
        Nivel 2: Recomendación al administrador.
        Nivel 3: Disparo de webhook a n8n para notificación operativa.
        Nivel 4: Acción sensible -> Bloqueada en PENDIENTE_APROBACION (Cero ejecuciones sin confirmación).
        """
        autonomia = regla.nivel_autonomia

        if autonomia == NivelAutonomia.OBSERVACION:
            return None

        if autonomia == NivelAutonomia.ALERTA:
            return AccionAgente(
                id=str(uuid.uuid4()),
                alerta_id=alerta.id,
                tipo_accion="NOTIFICACION_INTERNA_DASHBOARD",
                nivel_autonomia=NivelAutonomia.ALERTA,
                estado=EstadoAccion.SUGERIDA,
                destinatario="DASHBOARD_CORE",
                payload={"alerta_id": alerta.id, "severidad": alerta.severidad}
            )

        if autonomia == NivelAutonomia.RECOMENDACION:
            return AccionAgente(
                id=str(uuid.uuid4()),
                alerta_id=alerta.id,
                tipo_accion="RECOMENDAR_PLAN_ACCION",
                nivel_autonomia=NivelAutonomia.RECOMENDACION,
                estado=EstadoAccion.SUGERIDA,
                destinatario="ADMINISTRADOR",
                payload={"recomendacion": alerta.recomendacion}
            )

        if autonomia == NivelAutonomia.AUTOMATIZACION_CONTROLADA:
            return AccionAgente(
                id=str(uuid.uuid4()),
                alerta_id=alerta.id,
                tipo_accion="DESPACHAR_WEBHOOK_N8N",
                nivel_autonomia=NivelAutonomia.AUTOMATIZACION_CONTROLADA,
                estado=EstadoAccion.SOLICITADA,
                destinatario=regla.destinatarios[0] if regla.destinatarios else "n8n_webhook",
                payload={
                    "alerta_id": alerta.id,
                    "titulo": alerta.titulo,
                    "severidad": alerta.severidad,
                    "valor_observado": alerta.valor_observado,
                    "explicacion": alerta.explicacion,
                    "destinatarios": regla.destinatarios
                }
            )

        if autonomia == NivelAutonomia.ACCION_SENSIBLE:
            # Nivel 4: NUNCA se ejecuta de forma automática. Permanece en PENDIENTE_APROBACION
            return AccionAgente(
                id=str(uuid.uuid4()),
                alerta_id=alerta.id,
                tipo_accion="MODIFICAR_POLITICA_O_CAMPANA_SENSIBLE",
                nivel_autonomia=NivelAutonomia.ACCION_SENSIBLE,
                estado=EstadoAccion.PENDIENTE_APROBACION,
                destinatario="SUPER_ADMINISTRADOR",
                payload={
                    "requiere_autorizacion_humana": True,
                    "alerta_id": alerta.id,
                    "accion": alerta.recomendacion,
                    "valor_observado": alerta.valor_observado,
                    "evidencia": alerta.evidencia_json,
                }
            )

        return None

