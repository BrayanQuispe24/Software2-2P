import { Ejercicio } from '../../../ejercicios/domain/models/ejercicio.model';

export interface RutinaEjercicio {
  id?: string;
  series: number;
  repeticiones: number;
  peso?: number;
  duracionSegundos?: number;
  descansoSegundos?: number;
  orden: number;
  observacion?: string;
  ejercicio: Ejercicio;
}

export interface Rutina {
  id: string;
  nombre: string;
  descripcion?: string;
  nivel: string;
  estado: boolean;
  rutinaEjercicios?: RutinaEjercicio[];
}

export interface EjercicioRutinaItemInput {
  idEjercicio: string;
  series: number;
  repeticiones: number;
  peso?: number;
  duracionSegundos?: number;
  descansoSegundos?: number;
  orden: number;
  observacion?: string;
}

export interface CrearRutinaInput {
  nombre: string;
  descripcion?: string;
  nivel: string;
  ejercicios: EjercicioRutinaItemInput[];
}
