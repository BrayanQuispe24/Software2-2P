package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper;

import com.apexfitness.gimnasio.domain.model.*;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.*;

import java.util.Collections;
import java.util.stream.Collectors;

public class PersistenceMapper {

    public static Disciplina toDomain(DisciplinaEntity entity) {
        if (entity == null) return null;
        return Disciplina.builder()
                .id(entity.getId())
                .codigo(entity.getCodigo())
                .nombre(entity.getNombre())
                .descripcion(entity.getDescripcion())
                .capacidadMaxima(entity.getCapacidadMaxima())
                .colorHex(entity.getColorHex())
                .activo(entity.getActivo())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static DisciplinaEntity toEntity(Disciplina domain) {
        if (domain == null) return null;
        return DisciplinaEntity.builder()
                .id(domain.getId())
                .codigo(domain.getCodigo())
                .nombre(domain.getNombre())
                .descripcion(domain.getDescripcion())
                .capacidadMaxima(domain.getCapacidadMaxima())
                .colorHex(domain.getColorHex())
                .activo(domain.getActivo())
                .build();
    }

    public static Horario toDomain(HorarioEntity entity) {
        if (entity == null) return null;
        return Horario.builder()
                .id(entity.getId())
                .diaSemana(entity.getDiaSemana())
                .horaInicio(entity.getHoraInicio())
                .horaFin(entity.getHoraFin())
                .turno(entity.getTurno())
                .capacidadAforo(entity.getCapacidadAforo())
                .activo(entity.getActivo())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static HorarioEntity toEntity(Horario domain) {
        if (domain == null) return null;
        return HorarioEntity.builder()
                .id(domain.getId())
                .diaSemana(domain.getDiaSemana())
                .horaInicio(domain.getHoraInicio())
                .horaFin(domain.getHoraFin())
                .turno(domain.getTurno())
                .capacidadAforo(domain.getCapacidadAforo())
                .activo(domain.getActivo())
                .build();
    }

    public static DisciplinaHorario toDomain(DisciplinaHorarioEntity entity) {
        if (entity == null) return null;
        return DisciplinaHorario.builder()
                .id(entity.getId())
                .disciplinaId(entity.getDisciplina() != null ? entity.getDisciplina().getId() : null)
                .disciplina(toDomain(entity.getDisciplina()))
                .horarioId(entity.getHorario() != null ? entity.getHorario().getId() : null)
                .horario(toDomain(entity.getHorario()))
                .instructorId(entity.getInstructorId())
                .cupoDisponible(entity.getCupoDisponible())
                .activo(entity.getActivo())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Plan toDomain(PlanEntity entity) {
        if (entity == null) return null;
        return Plan.builder()
                .id(entity.getId())
                .codigo(entity.getCodigo())
                .nombre(entity.getNombre())
                .descripcion(entity.getDescripcion())
                .duracionDias(entity.getDuracionDias())
                .sesionesTotales(entity.getSesionesTotales())
                .tipoAcceso(entity.getTipoAcceso())
                .activo(entity.getActivo())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static PlanEntity toEntity(Plan domain) {
        if (domain == null) return null;
        return PlanEntity.builder()
                .id(domain.getId())
                .codigo(domain.getCodigo())
                .nombre(domain.getNombre())
                .descripcion(domain.getDescripcion())
                .duracionDias(domain.getDuracionDias())
                .sesionesTotales(domain.getSesionesTotales())
                .tipoAcceso(domain.getTipoAcceso())
                .activo(domain.getActivo())
                .build();
    }

    public static Tarifa toDomain(TarifaEntity entity) {
        if (entity == null) return null;
        return Tarifa.builder()
                .id(entity.getId())
                .planId(entity.getPlan() != null ? entity.getPlan().getId() : null)
                .plan(toDomain(entity.getPlan()))
                .nombre(entity.getNombre())
                .monto(entity.getMonto())
                .moneda(entity.getMoneda())
                .matriculaInscripcion(entity.getMatriculaInscripcion())
                .fechaInicio(entity.getFechaInicio())
                .fechaFin(entity.getFechaFin())
                .activa(entity.getActiva())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static TipoDocumento toDomain(TipoDocumentoEntity entity) {
        if (entity == null) return null;
        return TipoDocumento.builder()
                .id(entity.getId())
                .codigo(entity.getCodigo())
                .nombre(entity.getNombre())
                .descripcion(entity.getDescripcion())
                .obligatorio(entity.getObligatorio())
                .activo(entity.getActivo())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static FormularioSolicitud toDomain(FormularioSolicitudEntity entity) {
        if (entity == null) return null;
        return FormularioSolicitud.builder()
                .id(entity.getId())
                .numeroSolicitud(entity.getNumeroSolicitud())
                .clienteId(entity.getClienteId())
                .planId(entity.getPlan() != null ? entity.getPlan().getId() : null)
                .plan(toDomain(entity.getPlan()))
                .disciplinaId(entity.getDisciplina() != null ? entity.getDisciplina().getId() : null)
                .disciplina(toDomain(entity.getDisciplina()))
                .fechaSolicitud(entity.getFechaSolicitud())
                .estado(entity.getEstado())
                .motivoRechazo(entity.getMotivoRechazo())
                .observaciones(entity.getObservaciones())
                .documentos(entity.getDocumentos() != null
                        ? entity.getDocumentos().stream().map(PersistenceMapper::toDomain).collect(Collectors.toList())
                        : Collections.emptyList())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Documento toDomain(DocumentoEntity entity) {
        if (entity == null) return null;
        return Documento.builder()
                .id(entity.getId())
                .formularioSolicitudId(entity.getFormularioSolicitud() != null ? entity.getFormularioSolicitud().getId() : null)
                .tipoDocumentoId(entity.getTipoDocumento() != null ? entity.getTipoDocumento().getId() : null)
                .tipoDocumento(toDomain(entity.getTipoDocumento()))
                .nombreArchivo(entity.getNombreArchivo())
                .urlArchivo(entity.getUrlArchivo())
                .estadoValidacion(entity.getEstadoValidacion())
                .observaciones(entity.getObservaciones())
                .fechaSubida(entity.getFechaSubida())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static BoletaInscripcion toDomain(BoletaInscripcionEntity entity) {
        if (entity == null) return null;
        return BoletaInscripcion.builder()
                .id(entity.getId())
                .codigoMatricula(entity.getCodigoMatricula())
                .clienteId(entity.getClienteId())
                .planId(entity.getPlan() != null ? entity.getPlan().getId() : null)
                .plan(toDomain(entity.getPlan()))
                .disciplinaId(entity.getDisciplina() != null ? entity.getDisciplina().getId() : (entity.getDisciplinaHorario() != null && entity.getDisciplinaHorario().getDisciplina() != null ? entity.getDisciplinaHorario().getDisciplina().getId() : null))
                .disciplina(toDomain(entity.getDisciplina() != null ? entity.getDisciplina() : (entity.getDisciplinaHorario() != null ? entity.getDisciplinaHorario().getDisciplina() : null)))
                .disciplinaHorarioId(entity.getDisciplinaHorario() != null ? entity.getDisciplinaHorario().getId() : null)
                .disciplinaHorario(toDomain(entity.getDisciplinaHorario()))
                .formularioSolicitudId(entity.getFormularioSolicitud() != null ? entity.getFormularioSolicitud().getId() : null)
                .formularioSolicitud(toDomain(entity.getFormularioSolicitud()))
                .fechaInicio(entity.getFechaInicio())
                .fechaFin(entity.getFechaFin())
                .totalSesiones(entity.getTotalSesiones())
                .sesionesConsumidas(entity.getSesionesConsumidas())
                .estado(entity.getEstado())
                .boletaPago(toDomain(entity.getBoletaPago()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static BoletaPago toDomain(BoletaPagoEntity entity) {
        if (entity == null) return null;
        return BoletaPago.builder()
                .id(entity.getId())
                .boletaInscripcionId(entity.getBoletaInscripcion() != null ? entity.getBoletaInscripcion().getId() : null)
                .tarifaId(entity.getTarifa() != null ? entity.getTarifa().getId() : null)
                .tarifa(toDomain(entity.getTarifa()))
                .numeroComprobante(entity.getNumeroComprobante())
                .montoSubtotal(entity.getMontoSubtotal())
                .montoDescuento(entity.getMontoDescuento())
                .montoTotal(entity.getMontoTotal())
                .metodoPago(entity.getMetodoPago())
                .estado(entity.getEstado())
                .codigoTransaccionExterna(entity.getCodigoTransaccionExterna())
                .fechaPago(entity.getFechaPago())
                .comprobanteUrl(entity.getComprobanteUrl())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static RegistroAcceso toDomain(RegistroAccesoEntity entity) {
        if (entity == null) return null;
        return RegistroAcceso.builder()
                .id(entity.getId())
                .clienteId(entity.getClienteId())
                .boletaInscripcionId(entity.getBoletaInscripcion() != null ? entity.getBoletaInscripcion().getId() : null)
                .boletaInscripcion(toDomain(entity.getBoletaInscripcion()))
                .tipoMovimiento(entity.getTipoMovimiento())
                .estadoAcceso(entity.getEstadoAcceso())
                .fechaHora(entity.getFechaHora())
                .dispositivoTorniquete(entity.getDispositivoTorniquete())
                .motivoDenegacion(entity.getMotivoDenegacion())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
