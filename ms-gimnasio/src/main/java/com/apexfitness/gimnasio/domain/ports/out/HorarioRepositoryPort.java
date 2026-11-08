package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.model.Horario;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HorarioRepositoryPort {
    List<Horario> findAll(Boolean soloActivos);
    Optional<Horario> findById(UUID id);
    Horario save(Horario horario);
}
