package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository;

import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.PlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataPlanRepository extends JpaRepository<PlanEntity, UUID> {
    List<PlanEntity> findByActivoTrue();
    Optional<PlanEntity> findByCodigo(String codigo);
}
