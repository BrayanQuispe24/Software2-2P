package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.model.Documento;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentoRepositoryPort {
    List<Documento> findByFormularioSolicitudId(UUID formularioSolicitudId);
    Optional<Documento> findById(UUID id);
    Documento save(Documento documento);
}
