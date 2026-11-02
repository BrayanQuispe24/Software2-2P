package com.apexfitness.gimnasio.domain.model.dto;

import com.apexfitness.gimnasio.domain.enums.TipoAccesoPlan;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class CatalogoCommands {

    @Builder
    public record CrearDisciplinaCommand(
            String codigo,
            String nombre,
            String descripcion,
            Integer capacidadMaxima,
            String colorHex
    ) {}

    @Builder
    public record CrearHorarioCommand(
            String diaSemana,
            String horaInicio,
            String horaFin,
            String turno,
            Integer capacidadAforo
    ) {}

    @Builder
    public record ActualizarHorarioCommand(
            String diaSemana,
            String horaInicio,
            String horaFin,
            String turno,
            Integer capacidadAforo,
            Boolean activo
    ) {}

    @Builder
    public record AsignarDisciplinaHorarioCommand(
            UUID disciplinaId,
            UUID horarioId,
            UUID instructorId,
            Integer cupoDisponible
    ) {}

    @Builder
    public record CrearPlanCommand(
            String codigo,
            String nombre,
            String descripcion,
            Integer duracionDias,
            Integer sesionesTotales,
            TipoAccesoPlan tipoAcceso
    ) {}

    @Builder
    public record CrearTarifaCommand(
            UUID planId,
            String nombre,
            BigDecimal monto,
            String moneda,
            BigDecimal matriculaInscripcion,
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {}

    @Builder
    public record CrearSolicitudCommand(
            UUID clienteId,
            UUID planId,
            UUID disciplinaId,
            String observaciones
    ) {}

    @Builder
    public record AdjuntarDocumentoCommand(
            UUID formularioSolicitudId,
            UUID tipoDocumentoId,
            String nombreArchivo,
            String urlArchivo
    ) {}

    @Builder
    public record ActualizarPlanCommand(
            String nombre,
            String descripcion,
            Integer duracionDias,
            Integer sesionesTotales,
            TipoAccesoPlan tipoAcceso,
            Boolean activo
    ) {}

    @Builder
    public record ActualizarTarifaCommand(
            String nombre,
            BigDecimal monto,
            String moneda,
            BigDecimal matriculaInscripcion,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Boolean activa
    ) {}

    @Builder
    public record ActualizarDisciplinaCommand(
            String nombre,
            String descripcion,
            Integer capacidadMaxima,
            String colorHex,
            Boolean activo
    ) {}
}
