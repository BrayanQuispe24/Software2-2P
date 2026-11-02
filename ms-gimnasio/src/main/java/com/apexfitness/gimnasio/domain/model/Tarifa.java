package com.apexfitness.gimnasio.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tarifa {
    private UUID id;
    private UUID planId;
    private Plan plan;
    private String nombre;
    private BigDecimal monto;
    private String moneda;
    private BigDecimal matriculaInscripcion;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Boolean activa;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
