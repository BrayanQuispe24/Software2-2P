package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository;

import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.TarifaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpringDataTarifaRepository extends JpaRepository<TarifaEntity, UUID> {
    List<TarifaEntity> findByPlanId(UUID planId);
    List<TarifaEntity> findByPlanIdAndActivaTrue(UUID planId);
}
