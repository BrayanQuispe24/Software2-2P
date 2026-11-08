package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity;

import com.apexfitness.gimnasio.domain.enums.EstadoPago;
import com.apexfitness.gimnasio.domain.enums.MetodoPago;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "boleta_pago")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoletaPagoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "boleta_inscripcion_id", nullable = false)
    private BoletaInscripcionEntity boletaInscripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarifa_id", nullable = false)
    private TarifaEntity tarifa;

    @Column(name = "numero_comprobante", nullable = false, unique = true, length = 50)
    private String numeroComprobante;

    @Column(name = "monto_subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoSubtotal;

    @Column(name = "monto_descuento", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoDescuento;

    @Column(name = "monto_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", nullable = false, length = 30)
    private MetodoPago metodoPago;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoPago estado;

    @Column(name = "codigo_transaccion_externa", length = 100)
    private String codigoTransaccionExterna;

    @Column(name = "fecha_pago")
    private OffsetDateTime fechaPago;

    @Column(name = "comprobante_url", length = 500)
    private String comprobanteUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
