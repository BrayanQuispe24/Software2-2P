package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.model.Disciplina;
import com.apexfitness.gimnasio.domain.ports.out.DisciplinaRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.DisciplinaEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataDisciplinaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DisciplinaRepositoryAdapter implements DisciplinaRepositoryPort {

    private final SpringDataDisciplinaRepository repository;

    @Override
    public List<Disciplina> findAll(Boolean soloActivas) {
        List<DisciplinaEntity> list = (soloActivas != null && soloActivas)
                ? repository.findByActivoTrue()
                : repository.findAll();
        return list.stream().map(PersistenceMapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<Disciplina> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<Disciplina> findByCodigo(String codigo) {
        return repository.findByCodigo(codigo).map(PersistenceMapper::toDomain);
    }

    @Override
    public Disciplina save(Disciplina disciplina) {
        DisciplinaEntity entity = PersistenceMapper.toEntity(disciplina);
        return PersistenceMapper.toDomain(repository.save(entity));
    }
}
