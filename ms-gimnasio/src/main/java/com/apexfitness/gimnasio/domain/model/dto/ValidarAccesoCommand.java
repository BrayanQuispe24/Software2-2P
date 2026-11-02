package com.apexfitness.gimnasio.domain.model.dto;

import com.apexfitness.gimnasio.domain.enums.TipoMovimientoAcceso;
import lombok.Builder;

import java.util.UUID;

@Builder
public record ValidarAccesoCommand(
        UUID clienteId,
        String dispositivoTorniquete,
        TipoMovimientoAcceso tipoMovimiento
) {}
