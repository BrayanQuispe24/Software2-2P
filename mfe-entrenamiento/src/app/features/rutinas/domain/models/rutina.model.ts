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

// ====================================================
// MODELOS NOSQL DOCUMENTALES (MONGODB)
// ====================================================

export interface SerieDetalle {
  set: number;
  repeticiones?: number;
  pesoKg?: number;
  rpeObjetivo?: number;
  duracionSegundos?: number;
  descansoSegundos?: number;
  nota?: string;
}

export interface EjercicioBloqueItem {
  ejercicioId?: string;
  nombre: string;
  series?: number;
  repeticiones?: number;
  pesoKg?: number;
  duracionSegundos?: number;
  descansoSegundos?: number;
  notaTecnica?: string;
  seriesDetalle?: SerieDetalle[];
}

export interface BloqueEntrenamiento {
  orden: number;
  nombre?: string;
  tipoBloque: string; // CALENTAMIENTO, FUERZA, HIPERTROFIA, HIIT, TABATA, MOVILIDAD, etc.
  metodo?: string;
  protocolo?: string;
  rondas?: number;
  intervaloTrabajoSeg?: number;
  intervaloDescansoSeg?: number;
  ejercicios: EjercicioBloqueItem[];
}

export interface RutinaPersonalizada {
  id: string;
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  objetivo: string;
  tipoEntrenamiento: string;
  nivel: string;
  estado: string;
  duracionEstimadaMinutos?: number;
  bloques: BloqueEntrenamiento[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GuardarRutinaPersonalizadaInput {
  id?: string;
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  objetivo: string;
  tipoEntrenamiento: string;
  nivel: string;
  estado?: string;
  duracionEstimadaMinutos?: number;
  bloques: BloqueEntrenamiento[];
}
