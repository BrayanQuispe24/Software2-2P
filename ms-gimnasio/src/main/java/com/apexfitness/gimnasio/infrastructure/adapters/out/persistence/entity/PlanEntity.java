package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity;

import com.apexfitness.gimnasio.domain.enums.TipoAccesoPlan;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "planes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "duracion_dias", nullable = false)
    private Integer duracionDias;

    @Column(name = "sesiones_totales")
    private Integer sesionesTotales;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_acceso", nullable = false, length = 30)
    private TipoAccesoPlan tipoAcceso;

    @Column(nullable = false)
    private Boolean activo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
