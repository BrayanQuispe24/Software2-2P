package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository;

import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.TipoDocumentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataTipoDocumentoRepository extends JpaRepository<TipoDocumentoEntity, UUID> {
    List<TipoDocumentoEntity> findByActivoTrue();
    Optional<TipoDocumentoEntity> findByCodigo(String codigo);
}
