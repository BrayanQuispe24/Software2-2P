package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository;

import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.DisciplinaHorarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataDisciplinaHorarioRepository extends JpaRepository<DisciplinaHorarioEntity, UUID> {
    List<DisciplinaHorarioEntity> findByDisciplinaId(UUID disciplinaId);
    Optional<DisciplinaHorarioEntity> findByDisciplinaIdAndHorarioId(UUID disciplinaId, UUID horarioId);

    @Modifying
    @Query("UPDATE DisciplinaHorarioEntity dh SET dh.cupoDisponible = dh.cupoDisponible - 1 WHERE dh.id = :id AND dh.cupoDisponible > 0")
    int decrementarCupo(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE DisciplinaHorarioEntity dh SET dh.cupoDisponible = dh.cupoDisponible + 1 WHERE dh.id = :id")
    int incrementarCupo(@Param("id") UUID id);
}
