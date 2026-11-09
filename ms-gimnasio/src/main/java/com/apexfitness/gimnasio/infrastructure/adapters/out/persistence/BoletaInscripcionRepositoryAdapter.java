package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.enums.EstadoInscripcion;
import com.apexfitness.gimnasio.domain.model.BoletaInscripcion;
import com.apexfitness.gimnasio.domain.ports.out.BoletaInscripcionRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.BoletaInscripcionEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.DisciplinaEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.DisciplinaHorarioEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.FormularioSolicitudEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.PlanEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataBoletaInscripcionRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataDisciplinaRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataDisciplinaHorarioRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataFormularioSolicitudRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BoletaInscripcionRepositoryAdapter implements BoletaInscripcionRepositoryPort {

    private final SpringDataBoletaInscripcionRepository repository;
    private final SpringDataPlanRepository planRepository;
    private final SpringDataDisciplinaRepository disciplinaRepository;
    private final SpringDataDisciplinaHorarioRepository disciplinaHorarioRepository;
    private final SpringDataFormularioSolicitudRepository formularioSolicitudRepository;

    @Override
    public List<BoletaInscripcion> findPage(int pagina, int limite) {
        return repository.findAll(org.springframework.data.domain.PageRequest.of(pagina, limite,
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt", "id")))
                .stream().map(PersistenceMapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<BoletaInscripcion> findAll(UUID clienteId, EstadoInscripcion estado) {
        return repository.findByFilter(clienteId, estado).stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<BoletaInscripcion> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<BoletaInscripcion> findByCodigoMatricula(String codigoMatricula) {
        return repository.findByCodigoMatricula(codigoMatricula).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<BoletaInscripcion> findInscripcionVigenteCliente(UUID clienteId, LocalDate fechaActual) {
        return repository.findVigenteByCliente(clienteId, fechaActual).map(PersistenceMapper::toDomain);
    }

    @Override
    public BoletaInscripcion save(BoletaInscripcion inscripcion) {
        PlanEntity plan = inscripcion.getPlanId() != null
                ? planRepository.findById(inscripcion.getPlanId()).orElse(null)
                : null;
        DisciplinaHorarioEntity dh = inscripcion.getDisciplinaHorarioId() != null
                ? disciplinaHorarioRepository.findById(inscripcion.getDisciplinaHorarioId()).orElse(null)
                : null;
        DisciplinaEntity disciplina = inscripcion.getDisciplinaId() != null
                ? disciplinaRepository.findById(inscripcion.getDisciplinaId()).orElse(null)
                : (dh != null ? dh.getDisciplina() : null);
        FormularioSolicitudEntity solicitud = inscripcion.getFormularioSolicitudId() != null
                ? formularioSolicitudRepository.findById(inscripcion.getFormularioSolicitudId()).orElse(null)
                : null;

        BoletaInscripcionEntity entity = BoletaInscripcionEntity.builder()
                .id(inscripcion.getId())
                .codigoMatricula(inscripcion.getCodigoMatricula())
                .clienteId(inscripcion.getClienteId())
                .plan(plan)
                .disciplina(disciplina)
                .disciplinaHorario(dh)
                .formularioSolicitud(solicitud)
                .fechaInicio(inscripcion.getFechaInicio())
                .fechaFin(inscripcion.getFechaFin())
                .totalSesiones(inscripcion.getTotalSesiones())
                .sesionesConsumidas(inscripcion.getSesionesConsumidas() != null ? inscripcion.getSesionesConsumidas() : 0)
                .estado(inscripcion.getEstado())
                .build();

        return PersistenceMapper.toDomain(repository.save(entity));
    }
}
