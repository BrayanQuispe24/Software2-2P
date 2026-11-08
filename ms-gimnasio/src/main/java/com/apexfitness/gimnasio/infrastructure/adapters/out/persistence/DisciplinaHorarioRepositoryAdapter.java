package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.model.DisciplinaHorario;
import com.apexfitness.gimnasio.domain.ports.out.DisciplinaHorarioRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.DisciplinaEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.DisciplinaHorarioEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.HorarioEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataDisciplinaHorarioRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataDisciplinaRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataHorarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DisciplinaHorarioRepositoryAdapter implements DisciplinaHorarioRepositoryPort {

    private final SpringDataDisciplinaHorarioRepository repository;
    private final SpringDataDisciplinaRepository disciplinaRepository;
    private final SpringDataHorarioRepository horarioRepository;

    @Override
    public List<DisciplinaHorario> findAll() {
        return repository.findAll().stream().map(PersistenceMapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<DisciplinaHorario> findByDisciplinaId(UUID disciplinaId) {
        return repository.findByDisciplinaId(disciplinaId).stream().map(PersistenceMapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<DisciplinaHorario> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<DisciplinaHorario> findByDisciplinaIdAndHorarioId(UUID disciplinaId, UUID horarioId) {
        return repository.findByDisciplinaIdAndHorarioId(disciplinaId, horarioId).map(PersistenceMapper::toDomain);
    }

    @Override
    public DisciplinaHorario save(DisciplinaHorario dh) {
        DisciplinaEntity disciplina = dh.getDisciplinaId() != null
                ? disciplinaRepository.findById(dh.getDisciplinaId()).orElse(null)
                : null;
        HorarioEntity horario = dh.getHorarioId() != null
                ? horarioRepository.findById(dh.getHorarioId()).orElse(null)
                : null;

        DisciplinaHorarioEntity entity = DisciplinaHorarioEntity.builder()
                .id(dh.getId())
                .disciplina(disciplina)
                .horario(horario)
                .instructorId(dh.getInstructorId())
                .cupoDisponible(dh.getCupoDisponible())
                .activo(dh.getActivo() != null ? dh.getActivo() : true)
                .build();

        return PersistenceMapper.toDomain(repository.save(entity));
    }

    @Override
    public void decrementarCupo(UUID id) {
        repository.decrementarCupo(id);
    }

    @Override
    public void incrementarCupo(UUID id) {
        repository.incrementarCupo(id);
    }
}
