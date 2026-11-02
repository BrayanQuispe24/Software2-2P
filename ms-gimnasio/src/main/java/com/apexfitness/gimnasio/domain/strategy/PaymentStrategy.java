package com.apexfitness.gimnasio.domain.strategy;

import com.apexfitness.gimnasio.domain.enums.MetodoPago;

public interface PaymentStrategy {
    MetodoPago getMetodoPago();
    void validar(PagoContext context);
    ResultadoPago procesar(PagoContext context);
}
