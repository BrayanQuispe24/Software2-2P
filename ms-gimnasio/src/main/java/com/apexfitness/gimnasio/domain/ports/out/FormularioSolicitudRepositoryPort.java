package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.enums.EstadoSolicitud;
import com.apexfitness.gimnasio.domain.model.FormularioSolicitud;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FormularioSolicitudRepositoryPort {
    List<FormularioSolicitud> findAll(EstadoSolicitud estado, UUID clienteId);
    Optional<FormularioSolicitud> findById(UUID id);
    Optional<FormularioSolicitud> findByNumeroSolicitud(String numeroSolicitud);
    FormularioSolicitud save(FormularioSolicitud solicitud);
}
