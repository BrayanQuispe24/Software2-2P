package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.enums.EstadoInscripcion;
import com.apexfitness.gimnasio.domain.model.BoletaInscripcion;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BoletaInscripcionRepositoryPort {
    List<BoletaInscripcion> findAll(UUID clienteId, EstadoInscripcion estado);
    Optional<BoletaInscripcion> findById(UUID id);
    Optional<BoletaInscripcion> findByCodigoMatricula(String codigoMatricula);
    Optional<BoletaInscripcion> findInscripcionVigenteCliente(UUID clienteId, LocalDate fechaActual);
    BoletaInscripcion save(BoletaInscripcion inscripcion);
}
