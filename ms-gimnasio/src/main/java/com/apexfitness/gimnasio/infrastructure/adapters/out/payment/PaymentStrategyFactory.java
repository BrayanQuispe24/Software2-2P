package com.apexfitness.gimnasio.infrastructure.adapters.out.payment;

import com.apexfitness.gimnasio.domain.enums.MetodoPago;
import com.apexfitness.gimnasio.domain.strategy.PaymentStrategy;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class PaymentStrategyFactory {

    private final Map<MetodoPago, PaymentStrategy> strategies = new EnumMap<>(MetodoPago.class);

    public PaymentStrategyFactory(List<PaymentStrategy> strategyList) {
        for (PaymentStrategy strategy : strategyList) {
            strategies.put(strategy.getMetodoPago(), strategy);
        }
    }

    public PaymentStrategy getStrategy(MetodoPago metodoPago) {
        if (metodoPago == null) {
            throw new IllegalArgumentException("Debe seleccionar un método de pago válido.");
        }
        PaymentStrategy strategy = strategies.get(metodoPago);
        if (strategy == null) {
            throw new UnsupportedOperationException("No se encontró una estrategia implementada para el método de pago: " + metodoPago);
        }
        return strategy;
    }
}
