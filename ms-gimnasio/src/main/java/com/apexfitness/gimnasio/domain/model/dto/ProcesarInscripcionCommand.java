package com.apexfitness.gimnasio.domain.model.dto;

import com.apexfitness.gimnasio.domain.enums.MetodoPago;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Builder
public record ProcesarInscripcionCommand(
        UUID solicitudId,
        UUID clienteId,
        UUID planId,
        UUID tarifaId,
        UUID disciplinaId,
        UUID disciplinaHorarioId,
        LocalDate fechaInicio,
        MetodoPago metodoPago,
        BigDecimal montoDescuento,
        String codigoTransaccionExterna,
        String comprobanteUrl,
        DatosPagoEfectivoInput datosEfectivo,
        DatosPagoQrInput datosQr,
        DatosPagoStripeInput datosStripe
) {}
