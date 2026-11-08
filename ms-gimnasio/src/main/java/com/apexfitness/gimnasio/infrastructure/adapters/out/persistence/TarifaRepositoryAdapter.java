package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.model.Tarifa;
import com.apexfitness.gimnasio.domain.ports.out.TarifaRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.PlanEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.TarifaEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataPlanRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataTarifaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TarifaRepositoryAdapter implements TarifaRepositoryPort {

    private final SpringDataTarifaRepository repository;
    private final SpringDataPlanRepository planRepository;

    @Override
    public List<Tarifa> findByPlanId(UUID planId) {
        return repository.findByPlanIdAndActivaTrue(planId).stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Tarifa> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Tarifa save(Tarifa tarifa) {
        PlanEntity plan = tarifa.getPlanId() != null
                ? planRepository.findById(tarifa.getPlanId()).orElse(null)
                : null;

        TarifaEntity entity = TarifaEntity.builder()
                .id(tarifa.getId())
                .plan(plan)
                .nombre(tarifa.getNombre())
                .monto(tarifa.getMonto())
                .moneda(tarifa.getMoneda() != null ? tarifa.getMoneda() : "BOB")
                .matriculaInscripcion(tarifa.getMatriculaInscripcion())
                .fechaInicio(tarifa.getFechaInicio())
                .fechaFin(tarifa.getFechaFin())
                .activa(tarifa.getActiva() != null ? tarifa.getActiva() : true)
                .build();

        return PersistenceMapper.toDomain(repository.save(entity));
    }
}
