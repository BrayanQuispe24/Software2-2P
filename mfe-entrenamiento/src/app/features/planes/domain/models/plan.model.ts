import { Rutina } from '../../../rutinas/domain/models/rutina.model';

export interface PlanEntrenamientoRutina {
  id: string;
  diaSemana: string;
  rutina: Rutina;
}

export interface PlanEntrenamiento {
  id: string;
  idUsuario: string;
  nombre: string;
  objetivo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: boolean;
  observacion?: string;
  rutinasProgramadas: PlanEntrenamientoRutina[];
}

export interface RutinaDiaInput {
  idRutina: string;
  diaSemana: string;
}

export interface AsignarPlanEntrenamientoInput {
  idUsuario: string;
  nombre: string;
  objetivo: string;
  fechaInicio: string;
  fechaFin: string;
  observacion?: string;
  rutinas: RutinaDiaInput[];
}
