package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.model.RegistroAcceso;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistroAccesoRepositoryPort {
    List<RegistroAcceso> findAll(UUID clienteId, int limite);
    List<RegistroAcceso> findPage(int pagina, int limite);
    Optional<RegistroAcceso> findById(UUID id);
    RegistroAcceso save(RegistroAcceso registro);
    boolean existeEntradaPermitidaReciente(UUID clienteId, java.time.OffsetDateTime desde);
}
