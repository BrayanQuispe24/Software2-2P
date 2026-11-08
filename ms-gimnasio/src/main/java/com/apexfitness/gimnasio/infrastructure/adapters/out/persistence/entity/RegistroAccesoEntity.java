package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity;

import com.apexfitness.gimnasio.domain.enums.EstadoAcceso;
import com.apexfitness.gimnasio.domain.enums.TipoMovimientoAcceso;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "registro_entrada_salida")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistroAccesoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "cliente_id", nullable = false)
    private UUID clienteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "boleta_inscripcion_id")
    private BoletaInscripcionEntity boletaInscripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movimiento", nullable = false, length = 10)
    private TipoMovimientoAcceso tipoMovimiento;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_acceso", nullable = false, length = 20)
    private EstadoAcceso estadoAcceso;

    @Column(name = "fecha_hora", nullable = false)
    private OffsetDateTime fechaHora;

    @Column(name = "dispositivo_torniquete", length = 50)
    private String dispositivoTorniquete;

    @Column(name = "motivo_denegacion", columnDefinition = "TEXT")
    private String motivoDenegacion;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
