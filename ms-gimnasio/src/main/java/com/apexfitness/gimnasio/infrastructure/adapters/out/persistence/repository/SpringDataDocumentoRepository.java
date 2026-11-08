package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository;

import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.DocumentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpringDataDocumentoRepository extends JpaRepository<DocumentoEntity, UUID> {
    List<DocumentoEntity> findByFormularioSolicitudId(UUID formularioSolicitudId);
}
