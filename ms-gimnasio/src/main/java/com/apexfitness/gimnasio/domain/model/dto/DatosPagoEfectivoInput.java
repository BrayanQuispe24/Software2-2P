package com.apexfitness.gimnasio.domain.model.dto;

import lombok.Builder;
import java.math.BigDecimal;

@Builder
public record DatosPagoEfectivoInput(
        BigDecimal montoRecibido
) {}
