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
public class Disciplina {
    private UUID id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private Integer capacidadMaxima;
    private String colorHex;
    private Boolean activo;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
