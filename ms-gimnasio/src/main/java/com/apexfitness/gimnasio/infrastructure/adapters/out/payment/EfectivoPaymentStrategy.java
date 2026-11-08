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
public class EfectivoPaymentStrategy implements PaymentStrategy {

    @Override
    public MetodoPago getMetodoPago() {
        return MetodoPago.EFECTIVO;
    }

    @Override
    public void validar(PagoContext context) {
        BigDecimal total = context.montoTotal() != null ? context.montoTotal() : BigDecimal.ZERO;
        BigDecimal recibido = context.montoRecibido();

        if (recibido == null) {
            throw new IllegalArgumentException("Para pagos en efectivo es obligatorio ingresar el monto recibido.");
        }

        if (recibido.compareTo(total) < 0) {
            throw new IllegalArgumentException(
                    String.format("Monto recibido (BOB %.2f) es insuficiente para cubrir el total (BOB %.2f).",
                            recibido.doubleValue(), total.doubleValue())
            );
        }
    }

    @Override
    public ResultadoPago procesar(PagoContext context) {
        validar(context);

        BigDecimal total = context.montoTotal() != null ? context.montoTotal() : BigDecimal.ZERO;
        BigDecimal recibido = context.montoRecibido();
        BigDecimal cambio = recibido.subtract(total);

        String transaccionId = "EFE-CAJA-" + System.currentTimeMillis();

        log.info("Pago en efectivo procesado con éxito. Total: {}, Recibido: {}, Cambio: {}, Transacción: {}",
                total, recibido, cambio, transaccionId);

        return ResultadoPago.builder()
                .exitoso(true)
                .estado(EstadoPago.PAGADO)
                .codigoTransaccion(transaccionId)
                .montoRecibido(recibido)
                .cambio(cambio)
                .fechaPago(OffsetDateTime.now())
                .mensaje(String.format("Pago en efectivo registrado. Cambio a entregar: BOB %.2f", cambio.doubleValue()))
                .metadata(Map.of("montoRecibido", recibido, "cambio", cambio))
                .build();
    }
}
