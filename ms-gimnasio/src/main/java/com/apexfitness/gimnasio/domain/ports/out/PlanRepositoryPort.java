package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.model.Plan;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlanRepositoryPort {
    List<Plan> findAll(Boolean soloActivos);
    Optional<Plan> findById(UUID id);
    Optional<Plan> findByCodigo(String codigo);
    Plan save(Plan plan);
}
