package com.apexfitness.gimnasio.domain.ports.in;

import com.apexfitness.gimnasio.domain.model.*;
import com.apexfitness.gimnasio.domain.model.dto.CatalogoCommands.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogoUseCase {
    List<Disciplina> listarDisciplinas(Boolean soloActivas);
    Optional<Disciplina> buscarDisciplinaPorId(UUID id);
    Disciplina crearDisciplina(CrearDisciplinaCommand command);
    Disciplina actualizarDisciplina(UUID id, ActualizarDisciplinaCommand command);
    boolean eliminarDisciplina(UUID id);
    Disciplina actualizarAforoDisciplina(UUID id, Integer capacidadMaxima);

    List<Horario> listarHorarios(Boolean soloActivos);
    Horario crearHorario(CrearHorarioCommand command);
    Horario actualizarHorario(UUID id, ActualizarHorarioCommand command);

    List<DisciplinaHorario> listarDisciplinaHorarios(UUID disciplinaId);
    DisciplinaHorario asignarDisciplinaHorario(AsignarDisciplinaHorarioCommand command);
    DisciplinaHorario actualizarCupoHorario(UUID disciplinaHorarioId, Integer cupoDisponible);
    boolean eliminarDisciplinaHorario(UUID disciplinaHorarioId);

    List<Plan> listarPlanes(Boolean soloActivos);
    Optional<Plan> buscarPlanPorId(UUID id);
    Plan crearPlan(CrearPlanCommand command);
    Plan actualizarPlan(UUID id, ActualizarPlanCommand command);
    boolean eliminarPlan(UUID id);

    List<Tarifa> listarTarifasPorPlan(UUID planId);
    Tarifa crearTarifa(CrearTarifaCommand command);
    Tarifa actualizarTarifa(UUID id, ActualizarTarifaCommand command);
    boolean eliminarTarifa(UUID id);
}
