package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.enums.EstadoSolicitud;
import com.apexfitness.gimnasio.domain.model.FormularioSolicitud;
import com.apexfitness.gimnasio.domain.ports.out.FormularioSolicitudRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.DisciplinaEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.FormularioSolicitudEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.PlanEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataDisciplinaRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataFormularioSolicitudRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FormularioSolicitudRepositoryAdapter implements FormularioSolicitudRepositoryPort {

    private final SpringDataFormularioSolicitudRepository repository;
    private final SpringDataPlanRepository planRepository;
    private final SpringDataDisciplinaRepository disciplinaRepository;

    @Override
    public List<FormularioSolicitud> findAll(EstadoSolicitud estado, UUID clienteId) {
        return repository.findByFilter(estado, clienteId).stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<FormularioSolicitud> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<FormularioSolicitud> findByNumeroSolicitud(String numeroSolicitud) {
        return repository.findByNumeroSolicitud(numeroSolicitud).map(PersistenceMapper::toDomain);
    }

    @Override
    public FormularioSolicitud save(FormularioSolicitud solicitud) {
        PlanEntity plan = solicitud.getPlanId() != null
                ? planRepository.findById(solicitud.getPlanId()).orElse(null)
                : null;
        DisciplinaEntity disciplina = solicitud.getDisciplinaId() != null
                ? disciplinaRepository.findById(solicitud.getDisciplinaId()).orElse(null)
                : null;

        FormularioSolicitudEntity entity = FormularioSolicitudEntity.builder()
                .id(solicitud.getId())
                .numeroSolicitud(solicitud.getNumeroSolicitud())
                .clienteId(solicitud.getClienteId())
                .plan(plan)
                .disciplina(disciplina)
                .fechaSolicitud(solicitud.getFechaSolicitud())
                .estado(solicitud.getEstado())
                .motivoRechazo(solicitud.getMotivoRechazo())
                .observaciones(solicitud.getObservaciones())
                .build();

        return PersistenceMapper.toDomain(repository.save(entity));
    }
}
