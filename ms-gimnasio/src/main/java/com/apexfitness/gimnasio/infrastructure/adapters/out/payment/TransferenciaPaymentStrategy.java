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
public class TransferenciaPaymentStrategy implements PaymentStrategy {

    @Override
    public MetodoPago getMetodoPago() {
        return MetodoPago.TRANSFERENCIA;
    }

    @Override
    public void validar(PagoContext context) {
        if (context.comprobanteUrl() == null && context.codigoTransaccion() == null) {
            throw new IllegalArgumentException("Para registrar una transferencia bancaria debe proporcionar el comprobante o el código de referencia.");
        }
    }

    @Override
    public ResultadoPago procesar(PagoContext context) {
        validar(context);

        BigDecimal total = context.montoTotal() != null ? context.montoTotal() : BigDecimal.ZERO;
        String transaccionId = context.codigoTransaccion() != null && !context.codigoTransaccion().isBlank()
                ? context.codigoTransaccion()
                : "TRF-" + System.currentTimeMillis();

        return ResultadoPago.builder()
                .exitoso(true)
                .estado(EstadoPago.PAGADO)
                .codigoTransaccion(transaccionId)
                .comprobanteUrl(context.comprobanteUrl())
                .montoRecibido(total)
                .cambio(BigDecimal.ZERO)
                .fechaPago(OffsetDateTime.now())
                .mensaje("Transferencia bancaria registrada.")
                .metadata(Map.of("canal", "TransferenciaBancaria"))
                .build();
    }
}
