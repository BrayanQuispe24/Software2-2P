package com.apexfitness.gimnasio.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisciplinaHorario {
    private UUID id;
    private UUID disciplinaId;
    private Disciplina disciplina;
    private UUID horarioId;
    private Horario horario;
    private UUID instructorId;
    private Integer cupoDisponible;
    private Boolean activo;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
