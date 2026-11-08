package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity;

import com.apexfitness.gimnasio.domain.enums.EstadoInscripcion;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "boleta_inscripcion")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoletaInscripcionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "codigo_matricula", nullable = false, unique = true, length = 30)
    private String codigoMatricula;

    @Column(name = "cliente_id", nullable = false)
    private UUID clienteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PlanEntity plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disciplina_id")
    private DisciplinaEntity disciplina;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disciplina_horario_id")
    private DisciplinaHorarioEntity disciplinaHorario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formulario_solicitud_id")
    private FormularioSolicitudEntity formularioSolicitud;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(name = "total_sesiones")
    private Integer totalSesiones;

    @Column(name = "sesiones_consumidas", nullable = false)
    private Integer sesionesConsumidas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoInscripcion estado;

    @OneToOne(mappedBy = "boletaInscripcion", cascade = CascadeType.ALL)
    private BoletaPagoEntity boletaPago;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
