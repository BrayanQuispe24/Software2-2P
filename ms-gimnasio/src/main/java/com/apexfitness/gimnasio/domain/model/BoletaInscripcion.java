package com.apexfitness.gimnasio.domain.model;

import com.apexfitness.gimnasio.domain.enums.EstadoInscripcion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoletaInscripcion {
    private UUID id;
    private String codigoMatricula;
    private UUID clienteId;
    private UUID planId;
    private Plan plan;
    private UUID disciplinaId;
    private Disciplina disciplina;
    private UUID disciplinaHorarioId;
    private DisciplinaHorario disciplinaHorario;
    private UUID formularioSolicitudId;
    private FormularioSolicitud formularioSolicitud;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Integer totalSesiones;
    private Integer sesionesConsumidas;
    private EstadoInscripcion estado;
    private BoletaPago boletaPago;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
