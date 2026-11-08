package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity;

import com.apexfitness.gimnasio.domain.enums.EstadoSolicitud;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "formulario_solicitud")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormularioSolicitudEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "numero_solicitud", nullable = false, unique = true, length = 30)
    private String numeroSolicitud;

    @Column(name = "cliente_id", nullable = false)
    private UUID clienteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PlanEntity plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disciplina_id")
    private DisciplinaEntity disciplina;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDate fechaSolicitud;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoSolicitud estado;

    @Column(name = "motivo_rechazo", columnDefinition = "TEXT")
    private String motivoRechazo;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @OneToMany(mappedBy = "formularioSolicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DocumentoEntity> documentos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
