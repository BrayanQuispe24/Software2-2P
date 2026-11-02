package com.apexfitness.gimnasio.domain.model;

import com.apexfitness.gimnasio.domain.enums.TipoAccesoPlan;
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
public class Plan {
    private UUID id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private Integer duracionDias;
    private Integer sesionesTotales;
    private TipoAccesoPlan tipoAcceso;
    private Boolean activo;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
