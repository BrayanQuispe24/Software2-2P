package com.apexfitness.gimnasio.domain.strategy;

import com.apexfitness.gimnasio.domain.enums.MetodoPago;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Builder
public record PagoContext(
        UUID boletaPagoId,
        UUID clienteId,
        BigDecimal montoTotal,
        MetodoPago metodoPago,
        // Datos Efectivo
        BigDecimal montoRecibido,
        // Datos QR
        String comprobanteUrl,
        String codigoTransaccion,
        // Datos Stripe / Tarjeta
        String stripeToken,
        String numeroTarjeta,
        String titularTarjeta,
        String expiracionMes,
        String expiracionAnio,
        String cvc,
        Map<String, Object> metadata
) {}
