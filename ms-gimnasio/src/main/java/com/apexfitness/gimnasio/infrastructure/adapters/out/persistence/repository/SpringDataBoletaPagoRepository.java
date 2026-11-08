package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository;

import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.BoletaPagoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataBoletaPagoRepository extends JpaRepository<BoletaPagoEntity, UUID> {
    Optional<BoletaPagoEntity> findByNumeroComprobante(String numeroComprobante);
    Optional<BoletaPagoEntity> findByBoletaInscripcionId(UUID boletaInscripcionId);

    @Query("SELECT p FROM BoletaPagoEntity p WHERE p.boletaInscripcion.clienteId = :clienteId ORDER BY p.createdAt DESC")
    List<BoletaPagoEntity> findByClienteId(@Param("clienteId") UUID clienteId);
}
