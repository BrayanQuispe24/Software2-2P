package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository;

import com.apexfitness.gimnasio.domain.enums.EstadoSolicitud;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.FormularioSolicitudEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataFormularioSolicitudRepository extends JpaRepository<FormularioSolicitudEntity, UUID> {
    Optional<FormularioSolicitudEntity> findByNumeroSolicitud(String numeroSolicitud);

    @Query("SELECT s FROM FormularioSolicitudEntity s " +
           "WHERE (:estado IS NULL OR s.estado = :estado) " +
           "AND (:clienteId IS NULL OR s.clienteId = :clienteId) " +
           "ORDER BY s.createdAt DESC")
    List<FormularioSolicitudEntity> findByFilter(@Param("estado") EstadoSolicitud estado, @Param("clienteId") UUID clienteId);
}
