package com.apexfitness.gimnasio.domain.model.dto;

import lombok.Builder;

@Builder
public record DatosPagoStripeInput(
        String numeroTarjeta,
        String expiracionMes,
        String expiracionAnio,
        String cvc,
        String titular,
        String stripePaymentMethodId
) {}
