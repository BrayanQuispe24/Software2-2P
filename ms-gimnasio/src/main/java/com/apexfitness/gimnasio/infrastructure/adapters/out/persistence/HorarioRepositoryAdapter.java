package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.model.Horario;
import com.apexfitness.gimnasio.domain.ports.out.HorarioRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.HorarioEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataHorarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class HorarioRepositoryAdapter implements HorarioRepositoryPort {

    private final SpringDataHorarioRepository repository;

    @Override
    public List<Horario> findAll(Boolean soloActivos) {
        List<HorarioEntity> list = (soloActivos != null && soloActivos)
                ? repository.findByActivoTrue()
                : repository.findAll();
        return list.stream().map(PersistenceMapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<Horario> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Horario save(Horario horario) {
        HorarioEntity entity = PersistenceMapper.toEntity(horario);
        return PersistenceMapper.toDomain(repository.save(entity));
    }
}
