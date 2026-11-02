package com.apexfitness.gimnasio.domain.strategy;

import com.apexfitness.gimnasio.domain.enums.EstadoPago;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

@Builder
public record ResultadoPago(
        boolean exitoso,
        EstadoPago estado,
        String codigoTransaccion,
        String comprobanteUrl,
        BigDecimal montoRecibido,
        BigDecimal cambio,
        String mensaje,
        OffsetDateTime fechaPago,
        Map<String, Object> metadata
) {}
