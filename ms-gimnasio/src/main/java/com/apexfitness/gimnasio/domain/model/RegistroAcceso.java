package com.apexfitness.gimnasio.domain.model;

import com.apexfitness.gimnasio.domain.enums.EstadoAcceso;
import com.apexfitness.gimnasio.domain.enums.TipoMovimientoAcceso;
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
public class RegistroAcceso {
    private UUID id;
    private UUID clienteId;
    private UUID boletaInscripcionId;
    private BoletaInscripcion boletaInscripcion;
    private TipoMovimientoAcceso tipoMovimiento;
    private EstadoAcceso estadoAcceso;
    private OffsetDateTime fechaHora;
    private String dispositivoTorniquete;
    private String motivoDenegacion;
    private OffsetDateTime createdAt;
}
