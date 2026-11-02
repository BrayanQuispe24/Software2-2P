package com.apexfitness.gimnasio.application.service;

import com.apexfitness.gimnasio.domain.model.*;
import com.apexfitness.gimnasio.domain.model.dto.CatalogoCommands.*;
import com.apexfitness.gimnasio.domain.ports.in.CatalogoUseCase;
import com.apexfitness.gimnasio.domain.ports.out.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogoService implements CatalogoUseCase {

    private final DisciplinaRepositoryPort disciplinaRepository;
    private final HorarioRepositoryPort horarioRepository;
    private final DisciplinaHorarioRepositoryPort disciplinaHorarioRepository;
    private final PlanRepositoryPort planRepository;
    private final TarifaRepositoryPort tarifaRepository;

    @Override
    public List<Disciplina> listarDisciplinas(Boolean soloActivas) {
        return disciplinaRepository.findAll(soloActivas);
    }

    @Override
    public Optional<Disciplina> buscarDisciplinaPorId(UUID id) {
        return disciplinaRepository.findById(id);
    }

    @Override
    @Transactional
    public Disciplina crearDisciplina(CrearDisciplinaCommand command) {
        Disciplina disciplina = Disciplina.builder()
                .codigo(command.codigo())
                .nombre(command.nombre())
                .descripcion(command.descripcion())
                .capacidadMaxima(command.capacidadMaxima())
                .colorHex(command.colorHex() != null ? command.colorHex() : "#3B82F6")
                .activo(true)
                .build();
        return disciplinaRepository.save(disciplina);
    }

    @Override
    public List<Horario> listarHorarios(Boolean soloActivos) {
        return horarioRepository.findAll(soloActivos);
    }

    @Override
    @Transactional
    public Horario crearHorario(CrearHorarioCommand command) {
        Horario horario = Horario.builder()
                .diaSemana(command.diaSemana())
                .horaInicio(LocalTime.parse(command.horaInicio()))
                .horaFin(LocalTime.parse(command.horaFin()))
                .turno(command.turno())
                .capacidadAforo(command.capacidadAforo())
                .activo(true)
                .build();
        return horarioRepository.save(horario);
    }

    @Override
    @Transactional
    public Horario actualizarHorario(UUID id, ActualizarHorarioCommand command) {
        Horario horario = horarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horario no encontrado: " + id));
        if (command.diaSemana() != null) horario.setDiaSemana(command.diaSemana());
        if (command.horaInicio() != null) horario.setHoraInicio(LocalTime.parse(command.horaInicio()));
        if (command.horaFin() != null) horario.setHoraFin(LocalTime.parse(command.horaFin()));
        if (command.turno() != null) horario.setTurno(command.turno());
        if (command.capacidadAforo() != null) horario.setCapacidadAforo(command.capacidadAforo());
        if (command.activo() != null) horario.setActivo(command.activo());
        return horarioRepository.save(horario);
    }

    @Override
    public List<DisciplinaHorario> listarDisciplinaHorarios(UUID disciplinaId) {
        if (disciplinaId != null) {
            return disciplinaHorarioRepository.findByDisciplinaId(disciplinaId);
        }
        return disciplinaHorarioRepository.findAll();
    }

    @Override
    @Transactional
    public DisciplinaHorario asignarDisciplinaHorario(AsignarDisciplinaHorarioCommand command) {
        DisciplinaHorario dh = DisciplinaHorario.builder()
                .disciplinaId(command.disciplinaId())
                .horarioId(command.horarioId())
                .instructorId(command.instructorId())
                .cupoDisponible(command.cupoDisponible() != null ? command.cupoDisponible() : 20)
                .activo(true)
                .build();
        return disciplinaHorarioRepository.save(dh);
    }

    @Override
    public List<Plan> listarPlanes(Boolean soloActivos) {
        return planRepository.findAll(soloActivos);
    }

    @Override
    public Optional<Plan> buscarPlanPorId(UUID id) {
        return planRepository.findById(id);
    }

    @Override
    @Transactional
    public Plan crearPlan(CrearPlanCommand command) {
        Plan plan = Plan.builder()
                .codigo(command.codigo())
                .nombre(command.nombre())
                .descripcion(command.descripcion())
                .duracionDias(command.duracionDias())
                .sesionesTotales(command.sesionesTotales())
                .tipoAcceso(command.tipoAcceso())
                .activo(true)
                .build();
        return planRepository.save(plan);
    }

    @Override
    @Transactional
    public Disciplina actualizarDisciplina(UUID id, ActualizarDisciplinaCommand command) {
        Disciplina disciplina = disciplinaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina no encontrada: " + id));

        disciplina.setNombre(command.nombre());
        disciplina.setDescripcion(command.descripcion());
        disciplina.setCapacidadMaxima(command.capacidadMaxima());
        if (command.colorHex() != null) {
            disciplina.setColorHex(command.colorHex());
        }
        if (command.activo() != null) {
            disciplina.setActivo(command.activo());
        }

        return disciplinaRepository.save(disciplina);
    }

    @Override
    @Transactional
    public boolean eliminarDisciplina(UUID id) {
        Disciplina disciplina = disciplinaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina no encontrada: " + id));
        disciplina.setActivo(false);
        disciplinaRepository.save(disciplina);
        return true;
    }

    @Override
    @Transactional
    public Disciplina actualizarAforoDisciplina(UUID id, Integer capacidadMaxima) {
        Disciplina disciplina = disciplinaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina no encontrada: " + id));
        disciplina.setCapacidadMaxima(capacidadMaxima);
        return disciplinaRepository.save(disciplina);
    }

    @Override
    @Transactional
    public DisciplinaHorario actualizarCupoHorario(UUID disciplinaHorarioId, Integer cupoDisponible) {
        DisciplinaHorario dh = disciplinaHorarioRepository.findById(disciplinaHorarioId)
                .orElseThrow(() -> new IllegalArgumentException("Horario de disciplina no encontrado: " + disciplinaHorarioId));
        dh.setCupoDisponible(Math.max(0, cupoDisponible));
        return disciplinaHorarioRepository.save(dh);
    }

    @Override
    @Transactional
    public boolean eliminarDisciplinaHorario(UUID disciplinaHorarioId) {
        DisciplinaHorario dh = disciplinaHorarioRepository.findById(disciplinaHorarioId)
                .orElseThrow(() -> new IllegalArgumentException("Horario de disciplina no encontrado: " + disciplinaHorarioId));
        dh.setActivo(false);
        disciplinaHorarioRepository.save(dh);
        return true;
    }

    @Override
    public List<Tarifa> listarTarifasPorPlan(UUID planId) {
        return tarifaRepository.findByPlanId(planId);
    }

    @Override
    @Transactional
    public Tarifa crearTarifa(CrearTarifaCommand command) {
        Tarifa tarifa = Tarifa.builder()
                .planId(command.planId())
                .nombre(command.nombre())
                .monto(command.monto())
                .moneda(command.moneda() != null ? command.moneda() : "BOB")
                .matriculaInscripcion(command.matriculaInscripcion() != null ? command.matriculaInscripcion() : java.math.BigDecimal.ZERO)
                .fechaInicio(command.fechaInicio())
                .fechaFin(command.fechaFin())
                .activa(true)
                .build();
        return tarifaRepository.save(tarifa);
    }

    @Override
    @Transactional
    public Plan actualizarPlan(UUID id, ActualizarPlanCommand command) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan no encontrado: " + id));

        plan.setNombre(command.nombre());
        plan.setDescripcion(command.descripcion());
        plan.setDuracionDias(command.duracionDias());
        plan.setSesionesTotales(command.sesionesTotales());
        plan.setTipoAcceso(command.tipoAcceso());
        if (command.activo() != null) {
            plan.setActivo(command.activo());
        }

        return planRepository.save(plan);
    }

    @Override
    @Transactional
    public boolean eliminarPlan(UUID id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan no encontrado: " + id));
        plan.setActivo(false);
        planRepository.save(plan);
        return true;
    }

    @Override
    @Transactional
    public Tarifa actualizarTarifa(UUID id, ActualizarTarifaCommand command) {
        Tarifa tarifa = tarifaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tarifa no encontrada: " + id));

        tarifa.setNombre(command.nombre());
        tarifa.setMonto(command.monto());
        if (command.moneda() != null) {
            tarifa.setMoneda(command.moneda());
        }
        if (command.matriculaInscripcion() != null) {
            tarifa.setMatriculaInscripcion(command.matriculaInscripcion());
        }
        if (command.fechaInicio() != null) {
            tarifa.setFechaInicio(command.fechaInicio());
        }
        if (command.fechaFin() != null) {
            tarifa.setFechaFin(command.fechaFin());
        }
        if (command.activa() != null) {
            tarifa.setActiva(command.activa());
        }

        return tarifaRepository.save(tarifa);
    }

    @Override
    @Transactional
    public boolean eliminarTarifa(UUID id) {
        Tarifa tarifa = tarifaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tarifa no encontrada: " + id));
        tarifa.setActiva(false);
        tarifaRepository.save(tarifa);
        return true;
    }
}
