package com.apexfitness.gimnasio.domain.ports.in;

import com.apexfitness.gimnasio.domain.model.BoletaPago;
import com.apexfitness.gimnasio.domain.model.dto.ConfirmarPagoCommand;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PagoUseCase {
    BoletaPago confirmarPago(ConfirmarPagoCommand command);
    Optional<BoletaPago> buscarPorId(UUID id);
    Optional<BoletaPago> buscarPorInscripcionId(UUID boletaInscripcionId);
    List<BoletaPago> listarPagosPorCliente(UUID clienteId);
}
