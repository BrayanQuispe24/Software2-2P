package com.apexfitness.gimnasio.domain.model.dto;

import com.apexfitness.gimnasio.domain.enums.TipoMovimientoAcceso;
import lombok.Builder;

@Builder
public record ValidarAccesoQrCommand(
        String qrPayload,
        String dispositivoTorniquete,
        TipoMovimientoAcceso tipoMovimiento
) {}
