package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository;

import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.DisciplinaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataDisciplinaRepository extends JpaRepository<DisciplinaEntity, UUID> {
    List<DisciplinaEntity> findByActivoTrue();
    Optional<DisciplinaEntity> findByCodigo(String codigo);
}
