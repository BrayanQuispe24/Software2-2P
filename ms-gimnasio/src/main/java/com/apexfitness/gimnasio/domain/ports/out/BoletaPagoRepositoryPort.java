package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.model.BoletaPago;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BoletaPagoRepositoryPort {
    Optional<BoletaPago> findById(UUID id);
    Optional<BoletaPago> findByBoletaInscripcionId(UUID boletaInscripcionId);
    Optional<BoletaPago> findByNumeroComprobante(String numeroComprobante);
    List<BoletaPago> findByClienteId(UUID clienteId);
    BoletaPago save(BoletaPago pago);
}
