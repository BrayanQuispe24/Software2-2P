package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.model.TipoDocumento;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TipoDocumentoRepositoryPort {
    List<TipoDocumento> findAll();
    Optional<TipoDocumento> findById(UUID id);
    Optional<TipoDocumento> findByCodigo(String codigo);
    TipoDocumento save(TipoDocumento tipoDocumento);
}
