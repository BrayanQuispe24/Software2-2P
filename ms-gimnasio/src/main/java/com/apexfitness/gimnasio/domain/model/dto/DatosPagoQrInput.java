package com.apexfitness.gimnasio.domain.model.dto;

import lombok.Builder;

@Builder
public record DatosPagoQrInput(
        String comprobanteUrl,
        String codigoTransaccion
) {}
