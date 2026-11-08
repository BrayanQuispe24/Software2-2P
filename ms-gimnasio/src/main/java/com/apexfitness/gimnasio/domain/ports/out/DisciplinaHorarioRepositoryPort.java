package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.model.DisciplinaHorario;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DisciplinaHorarioRepositoryPort {
    List<DisciplinaHorario> findAll();
    List<DisciplinaHorario> findByDisciplinaId(UUID disciplinaId);
    Optional<DisciplinaHorario> findById(UUID id);
    Optional<DisciplinaHorario> findByDisciplinaIdAndHorarioId(UUID disciplinaId, UUID horarioId);
    DisciplinaHorario save(DisciplinaHorario dh);
    void decrementarCupo(UUID id);
    void incrementarCupo(UUID id);
}
