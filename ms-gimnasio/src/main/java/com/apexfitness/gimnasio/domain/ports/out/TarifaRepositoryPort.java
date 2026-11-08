package com.apexfitness.gimnasio.domain.ports.out;

import com.apexfitness.gimnasio.domain.model.Tarifa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TarifaRepositoryPort {
    List<Tarifa> findByPlanId(UUID planId);
    Optional<Tarifa> findById(UUID id);
    Tarifa save(Tarifa tarifa);
}
