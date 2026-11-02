package com.apexfitness.gimnasio.domain.model;

import com.apexfitness.gimnasio.domain.enums.EstadoPago;
import com.apexfitness.gimnasio.domain.enums.MetodoPago;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoletaPago {
    private UUID id;
    private UUID boletaInscripcionId;
    private UUID tarifaId;
    private Tarifa tarifa;
    private String numeroComprobante;
    private BigDecimal montoSubtotal;
    private BigDecimal montoDescuento;
    private BigDecimal montoTotal;
    private MetodoPago metodoPago;
    private EstadoPago estado;
    private String codigoTransaccionExterna;
    private OffsetDateTime fechaPago;
    private String comprobanteUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
