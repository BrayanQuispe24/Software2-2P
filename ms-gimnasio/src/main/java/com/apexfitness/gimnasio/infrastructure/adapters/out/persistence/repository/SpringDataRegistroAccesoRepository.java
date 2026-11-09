package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository;

import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.RegistroAccesoEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpringDataRegistroAccesoRepository extends JpaRepository<RegistroAccesoEntity, UUID> {
    @Query("SELECT r FROM RegistroAccesoEntity r " +
           "WHERE (:clienteId IS NULL OR r.clienteId = :clienteId) " +
           "ORDER BY r.fechaHora DESC, r.id DESC")
    List<RegistroAccesoEntity> findByFilter(@Param("clienteId") UUID clienteId, Pageable pageable);

    @Query("SELECT r FROM RegistroAccesoEntity r " +
           "WHERE r.clienteId = :clienteId " +
           "AND r.estadoAcceso = :estadoAcceso " +
           "ORDER BY r.fechaHora DESC")
    List<RegistroAccesoEntity> findUltimoAccesoPorEstado(
            @Param("clienteId") UUID clienteId,
            @Param("estadoAcceso") com.apexfitness.gimnasio.domain.enums.EstadoAcceso estadoAcceso,
            Pageable pageable
    );
}
