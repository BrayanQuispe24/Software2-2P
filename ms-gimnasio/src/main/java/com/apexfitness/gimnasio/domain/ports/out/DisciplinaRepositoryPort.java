package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.model.Disciplina;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DisciplinaRepositoryPort {
    List<Disciplina> findAll(Boolean soloActivas);
    Optional<Disciplina> findById(UUID id);
    Optional<Disciplina> findByCodigo(String codigo);
    Disciplina save(Disciplina disciplina);
}
