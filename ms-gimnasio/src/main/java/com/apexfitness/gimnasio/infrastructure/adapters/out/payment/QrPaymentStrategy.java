package com.apexfitness.gimnasio.infrastructure.adapters.out.payment;

import com.apexfitness.gimnasio.domain.enums.EstadoPago;
import com.apexfitness.gimnasio.domain.enums.MetodoPago;
import com.apexfitness.gimnasio.domain.strategy.PaymentStrategy;
import com.apexfitness.gimnasio.domain.strategy.PagoContext;
import com.apexfitness.gimnasio.domain.strategy.ResultadoPago;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

@Slf4j
@Component
public class QrPaymentStrategy implements PaymentStrategy {

    @Override
    public MetodoPago getMetodoPago() {
        return MetodoPago.QR;
    }

    @Override
    public void validar(PagoContext context) {
        if (context.comprobanteUrl() == null || context.comprobanteUrl().trim().isEmpty()) {
            throw new IllegalArgumentException("Para pagar por QR es obligatorio subir la captura o comprobante de transferencia.");
        }
    }

    @Override
    public ResultadoPago procesar(PagoContext context) {
        validar(context);

        String transaccionId = context.codigoTransaccion();
        if (transaccionId == null || transaccionId.trim().isEmpty()) {
            transaccionId = "QR-BCP-" + System.currentTimeMillis();
        }

        BigDecimal total = context.montoTotal() != null ? context.montoTotal() : BigDecimal.ZERO;

        log.info("Pago QR verificado y procesado con éxito. Total: {}, Transacción: {}, Comprobante: {}",
                total, transaccionId, context.comprobanteUrl());

        return ResultadoPago.builder()
                .exitoso(true)
                .estado(EstadoPago.PAGADO)
                .codigoTransaccion(transaccionId)
                .comprobanteUrl(context.comprobanteUrl())
                .montoRecibido(total)
                .cambio(BigDecimal.ZERO)
                .fechaPago(OffsetDateTime.now())
                .mensaje("Comprobante de pago QR verificado y validado.")
                .metadata(Map.of("comprobanteUrl", context.comprobanteUrl()))
                .build();
    }
}
