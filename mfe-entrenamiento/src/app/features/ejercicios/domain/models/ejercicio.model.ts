export interface TipoEjercicio {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: string;
}

export interface GrupoMuscular {
  id: string;
  nombre: string;
  descripcion?: string;
  zonaCorporal?: string;
}

export interface EjercicioGrupoMuscular {
  id: string;
  tipoParticipacion: string; // PRIMARIO, SECUNDARIO, ESTABILIZADOR
  observacion?: string;
  grupoMuscular: GrupoMuscular;
}

export interface Ejercicio {
  id: string;
  externalId?: string;
  nombre: string;
  descripcion?: string;
  urlVideo?: string;
  imagenes?: string[];
  fuerza?: string;
  equipamiento?: string;
  nivelDificultad: 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | string;
  mecanica?: string;
  patronMovimiento?: string;
  tipoEjercicio?: TipoEjercicio;
  gruposMusculares?: EjercicioGrupoMuscular[];
}

export interface CrearEjercicioInput {
  nombre: string;
  descripcion?: string;
  urlVideo?: string;
  imagenes?: string[];
  fuerza?: string;
  equipamiento?: string;
  nivelDificultad: string;
  mecanica?: string;
  patronMovimiento?: string;
  idTipoEjercicio: string;
  gruposMusculares?: Array<{
    idGrupoMuscular: string;
    tipoParticipacion: string;
    observacion?: string;
  }>;
}
