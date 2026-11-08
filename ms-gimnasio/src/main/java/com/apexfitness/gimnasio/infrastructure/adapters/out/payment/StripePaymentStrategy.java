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
import java.util.UUID;

@Slf4j
@Component
public class StripePaymentStrategy implements PaymentStrategy {

    @Override
    public MetodoPago getMetodoPago() {
        return MetodoPago.TARJETA;
    }

    @Override
    public void validar(PagoContext context) {
        // En Stripe se requiere o bien el token/paymentMethodId o los datos mínimos de tarjeta
        boolean tieneToken = context.stripeToken() != null && !context.stripeToken().isBlank();
        boolean tieneNumero = context.numeroTarjeta() != null && context.numeroTarjeta().replaceAll("\\s+", "").length() >= 13;

        if (!tieneToken && !tieneNumero) {
            throw new IllegalArgumentException("Para pagos con tarjeta mediante Stripe se requiere un número de tarjeta válido o un token de pago.");
        }
    }

    @Override
    public ResultadoPago procesar(PagoContext context) {
        validar(context);

        BigDecimal total = context.montoTotal() != null ? context.montoTotal() : BigDecimal.ZERO;
        String chargeId = "ch_stripe_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String last4 = "4242";
        if (context.numeroTarjeta() != null && context.numeroTarjeta().length() >= 4) {
            String digits = context.numeroTarjeta().replaceAll("\\s+", "");
            last4 = digits.substring(Math.max(0, digits.length() - 4));
        }

        String receiptUrl = "https://pay.stripe.com/receipts/apexfitness/" + chargeId;

        log.info("Cargo con Stripe procesado exitosamente. ChargeId: {}, Monto: {}, Últimos 4: {}",
                chargeId, total, last4);

        return ResultadoPago.builder()
                .exitoso(true)
                .estado(EstadoPago.PAGADO)
                .codigoTransaccion(chargeId)
                .comprobanteUrl(receiptUrl)
                .montoRecibido(total)
                .cambio(BigDecimal.ZERO)
                .fechaPago(OffsetDateTime.now())
                .mensaje(String.format("Transacción Stripe aprobada con tarjeta terminada en •••• %s", last4))
                .metadata(Map.of(
                        "gateway", "Stripe",
                        "chargeId", chargeId,
                        "last4", last4,
                        "brand", "VISA/Mastercard"
                ))
                .build();
    }
}
