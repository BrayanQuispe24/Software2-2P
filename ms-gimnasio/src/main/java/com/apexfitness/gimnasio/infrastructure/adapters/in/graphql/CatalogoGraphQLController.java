package com.apexfitness.gimnasio.infrastructure.adapters.in.graphql;

import com.apexfitness.gimnasio.domain.model.*;
import com.apexfitness.gimnasio.domain.model.dto.CatalogoCommands.*;
import com.apexfitness.gimnasio.domain.ports.in.CatalogoUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class CatalogoGraphQLController {

    private final CatalogoUseCase catalogoUseCase;

    // Queries
    @QueryMapping
    public List<Disciplina> disciplinas(@Argument Boolean soloActivas) {
        return catalogoUseCase.listarDisciplinas(soloActivas != null ? soloActivas : true);
    }

    @QueryMapping
    public Disciplina disciplina(@Argument UUID id) {
        return catalogoUseCase.buscarDisciplinaPorId(id).orElse(null);
    }

    @QueryMapping
    public List<Horario> horarios(@Argument Boolean soloActivos) {
        return catalogoUseCase.listarHorarios(soloActivos != null ? soloActivos : true);
    }

    @QueryMapping
    public List<DisciplinaHorario> disciplinaHorarios(@Argument UUID disciplinaId) {
        return catalogoUseCase.listarDisciplinaHorarios(disciplinaId);
    }

    @QueryMapping
    public List<Plan> planes(@Argument Boolean soloActivos) {
        return catalogoUseCase.listarPlanes(soloActivos != null ? soloActivos : true);
    }

    @QueryMapping
    public Plan plan(@Argument UUID id) {
        return catalogoUseCase.buscarPlanPorId(id).orElse(null);
    }

    @QueryMapping
    public List<Tarifa> tarifasPorPlan(@Argument UUID planId) {
        return catalogoUseCase.listarTarifasPorPlan(planId);
    }

    // Mutations
    @MutationMapping
    public Disciplina crearDisciplina(@Argument CrearDisciplinaCommand input) {
        return catalogoUseCase.crearDisciplina(input);
    }

    @MutationMapping
    public Disciplina actualizarDisciplina(@Argument UUID id, @Argument ActualizarDisciplinaCommand input) {
        return catalogoUseCase.actualizarDisciplina(id, input);
    }

    @MutationMapping
    public Boolean eliminarDisciplina(@Argument UUID id) {
        return catalogoUseCase.eliminarDisciplina(id);
    }

    @MutationMapping
    public Disciplina actualizarAforoDisciplina(@Argument UUID id, @Argument Integer capacidadMaxima) {
        return catalogoUseCase.actualizarAforoDisciplina(id, capacidadMaxima);
    }

    @MutationMapping
    public DisciplinaHorario actualizarCupoHorario(@Argument UUID disciplinaHorarioId, @Argument Integer cupoDisponible) {
        return catalogoUseCase.actualizarCupoHorario(disciplinaHorarioId, cupoDisponible);
    }

    @MutationMapping
    public Horario crearHorario(@Argument CrearHorarioCommand input) {
        return catalogoUseCase.crearHorario(input);
    }

    @MutationMapping
    public Horario actualizarHorario(@Argument UUID id, @Argument ActualizarHorarioCommand input) {
        return catalogoUseCase.actualizarHorario(id, input);
    }

    @MutationMapping
    public DisciplinaHorario asignarDisciplinaHorario(@Argument AsignarDisciplinaHorarioCommand input) {
        return catalogoUseCase.asignarDisciplinaHorario(input);
    }

    @MutationMapping
    public Boolean eliminarDisciplinaHorario(@Argument UUID disciplinaHorarioId) {
        return catalogoUseCase.eliminarDisciplinaHorario(disciplinaHorarioId);
    }

    @MutationMapping
    public Plan crearPlan(@Argument CrearPlanCommand input) {
        return catalogoUseCase.crearPlan(input);
    }

    @MutationMapping
    public Plan actualizarPlan(@Argument UUID id, @Argument ActualizarPlanCommand input) {
        return catalogoUseCase.actualizarPlan(id, input);
    }

    @MutationMapping
    public Boolean eliminarPlan(@Argument UUID id) {
        return catalogoUseCase.eliminarPlan(id);
    }

    @MutationMapping
    public Tarifa crearTarifa(@Argument CrearTarifaCommand input) {
        return catalogoUseCase.crearTarifa(input);
    }

    @MutationMapping
    public Tarifa actualizarTarifa(@Argument UUID id, @Argument ActualizarTarifaCommand input) {
        return catalogoUseCase.actualizarTarifa(id, input);
    }

    @MutationMapping
    public Boolean eliminarTarifa(@Argument UUID id) {
        return catalogoUseCase.eliminarTarifa(id);
    }

    // Batch Mappings para prevenir problema N+1
    @BatchMapping(typeName = "Disciplina", field = "horarios")
    public Map<Disciplina, List<DisciplinaHorario>> horarios(List<Disciplina> disciplinas) {
        Map<Disciplina, List<DisciplinaHorario>> result = new HashMap<>();
        for (Disciplina d : disciplinas) {
            List<DisciplinaHorario> dhs = catalogoUseCase.listarDisciplinaHorarios(d.getId())
                    .stream()
                    .filter(dh -> dh.getActivo() == null || dh.getActivo())
                    .collect(Collectors.toList());
            result.put(d, dhs);
        }
        return result;
    }

    @BatchMapping(typeName = "Plan", field = "tarifas")
    public Map<Plan, List<Tarifa>> tarifas(List<Plan> planes) {
        Map<Plan, List<Tarifa>> result = new HashMap<>();
        for (Plan p : planes) {
            List<Tarifa> list = catalogoUseCase.listarTarifasPorPlan(p.getId());
            result.put(p, list);
        }
        return result;
    }
}
