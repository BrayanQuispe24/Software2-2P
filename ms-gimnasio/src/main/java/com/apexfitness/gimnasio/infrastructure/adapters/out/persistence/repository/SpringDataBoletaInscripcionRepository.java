package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository;

import com.apexfitness.gimnasio.domain.enums.EstadoInscripcion;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.BoletaInscripcionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataBoletaInscripcionRepository extends JpaRepository<BoletaInscripcionEntity, UUID> {
    Optional<BoletaInscripcionEntity> findByCodigoMatricula(String codigoMatricula);

    @Query("SELECT b FROM BoletaInscripcionEntity b " +
           "WHERE (:clienteId IS NULL OR b.clienteId = :clienteId) " +
           "AND (:estado IS NULL OR b.estado = :estado) " +
           "ORDER BY b.createdAt DESC")
    List<BoletaInscripcionEntity> findByFilter(@Param("clienteId") UUID clienteId, @Param("estado") EstadoInscripcion estado);

    @Query("SELECT b FROM BoletaInscripcionEntity b " +
           "WHERE b.clienteId = :clienteId " +
           "AND b.estado = 'ACTIVA' " +
           "AND :fechaActual BETWEEN b.fechaInicio AND b.fechaFin " +
           "ORDER BY b.fechaFin DESC LIMIT 1")
    Optional<BoletaInscripcionEntity> findVigenteByCliente(@Param("clienteId") UUID clienteId, @Param("fechaActual") LocalDate fechaActual);
}
