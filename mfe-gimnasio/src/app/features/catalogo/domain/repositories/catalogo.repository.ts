import { Disciplina, Horario, DisciplinaHorario } from '../models/disciplina.model';
import { Plan, Tarifa } from '../models/plan.model';

export interface CrearDisciplinaInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  capacidadMaxima: number;
  colorHex?: string;
}

export interface CrearPlanInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  duracionDias: number;
  sesionesTotales?: number;
  tipoAcceso: string;
}

export interface CrearTarifaInput {
  planId: string;
  nombre: string;
  monto: number;
  moneda?: string;
  matriculaInscripcion?: number;
  fechaInicio: string;
  fechaFin?: string;
}

export interface ActualizarPlanInput {
  nombre: string;
  descripcion?: string;
  duracionDias: number;
  sesionesTotales?: number;
  tipoAcceso: string;
  activo?: boolean;
}

export interface ActualizarTarifaInput {
  nombre: string;
  monto: number;
  moneda?: string;
  matriculaInscripcion?: number;
  fechaInicio?: string;
  fechaFin?: string;
  activa?: boolean;
}

export interface ActualizarDisciplinaInput {
  nombre: string;
  descripcion?: string;
  capacidadMaxima: number;
  colorHex?: string;
  activo?: boolean;
}

export interface CrearHorarioInput {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  turno: string;
  capacidadAforo: number;
}

export interface ActualizarHorarioInput {
  diaSemana?: string;
  horaInicio?: string;
  horaFin?: string;
  turno?: string;
  capacidadAforo?: number;
  activo?: boolean;
}

export interface AsignarDisciplinaHorarioInput {
  disciplinaId: string;
  horarioId: string;
  instructorId?: string;
  cupoDisponible?: number;
}

export interface ICatalogoRepository {
  listarDisciplinas(soloActivas?: boolean): Promise<Disciplina[]>;
  listarHorarios(soloActivos?: boolean): Promise<Horario[]>;
  listarDisciplinaHorarios(disciplinaId?: string): Promise<DisciplinaHorario[]>;
  crearDisciplina(input: CrearDisciplinaInput): Promise<Disciplina>;
  actualizarDisciplina(id: string, input: ActualizarDisciplinaInput): Promise<Disciplina>;
  eliminarDisciplina(id: string): Promise<boolean>;
  actualizarAforoDisciplina(id: string, capacidadMaxima: number): Promise<Disciplina>;
  actualizarCupoHorario(disciplinaHorarioId: string, cupoDisponible: number): Promise<DisciplinaHorario>;
  crearHorario(input: CrearHorarioInput): Promise<Horario>;
  actualizarHorario(id: string, input: ActualizarHorarioInput): Promise<Horario>;
  asignarDisciplinaHorario(input: AsignarDisciplinaHorarioInput): Promise<DisciplinaHorario>;
  eliminarDisciplinaHorario(disciplinaHorarioId: string): Promise<boolean>;

  listarPlanes(soloActivos?: boolean): Promise<Plan[]>;
  crearPlan(input: CrearPlanInput): Promise<Plan>;
  actualizarPlan(id: string, input: ActualizarPlanInput): Promise<Plan>;
  eliminarPlan(id: string): Promise<boolean>;

  crearTarifa(input: CrearTarifaInput): Promise<Tarifa>;
  actualizarTarifa(id: string, input: ActualizarTarifaInput): Promise<Tarifa>;
  eliminarTarifa(id: string): Promise<boolean>;
}
