package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.model.Plan;
import com.apexfitness.gimnasio.domain.ports.out.PlanRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.PlanEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PlanRepositoryAdapter implements PlanRepositoryPort {

    private final SpringDataPlanRepository repository;

    @Override
    public List<Plan> findAll(Boolean soloActivos) {
        List<PlanEntity> list = (soloActivos != null && soloActivos)
                ? repository.findByActivoTrue()
                : repository.findAll();
        return list.stream().map(PersistenceMapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<Plan> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<Plan> findByCodigo(String codigo) {
        return repository.findByCodigo(codigo).map(PersistenceMapper::toDomain);
    }

    @Override
    public Plan save(Plan plan) {
        PlanEntity entity = PersistenceMapper.toEntity(plan);
        return PersistenceMapper.toDomain(repository.save(entity));
    }
}
