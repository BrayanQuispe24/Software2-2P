package com.apexfitness.gimnasio.domain.model.dto;

import com.apexfitness.gimnasio.domain.enums.MetodoPago;
import lombok.Builder;

import java.util.UUID;

@Builder
public record ConfirmarPagoCommand(
        UUID boletaPagoId,
        MetodoPago metodoPago,
        String codigoTransaccionExterna,
        String comprobanteUrl,
        DatosPagoEfectivoInput datosEfectivo,
        DatosPagoQrInput datosQr,
        DatosPagoStripeInput datosStripe
) {}
