package com.apexfitness.gimnasio.domain.ports.in;

import com.apexfitness.gimnasio.domain.enums.EstadoInscripcion;
import com.apexfitness.gimnasio.domain.model.BoletaInscripcion;
import com.apexfitness.gimnasio.domain.model.dto.ProcesarInscripcionCommand;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InscripcionUseCase {
    BoletaInscripcion procesarInscripcion(ProcesarInscripcionCommand command);
    List<BoletaInscripcion> listarInscripciones(UUID clienteId, EstadoInscripcion estado);
    List<BoletaInscripcion> listarInscripcionesPagina(int pagina, int limite);
    Optional<BoletaInscripcion> buscarPorId(UUID id);
    Optional<BoletaInscripcion> obtenerInscripcionActivaCliente(UUID clienteId);
    BoletaInscripcion congelarInscripcion(UUID id, String motivo);
    BoletaInscripcion reactivarInscripcion(UUID id);
}
