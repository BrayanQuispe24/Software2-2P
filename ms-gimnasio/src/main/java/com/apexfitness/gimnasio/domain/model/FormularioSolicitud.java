package com.apexfitness.gimnasio.domain.model;

import com.apexfitness.gimnasio.domain.enums.EstadoSolicitud;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormularioSolicitud {
    private UUID id;
    private String numeroSolicitud;
    private UUID clienteId;
    private UUID planId;
    private Plan plan;
    private UUID disciplinaId;
    private Disciplina disciplina;
    private LocalDate fechaSolicitud;
    private EstadoSolicitud estado;
    private String motivoRechazo;
    private String observaciones;
    private List<Documento> documentos;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
