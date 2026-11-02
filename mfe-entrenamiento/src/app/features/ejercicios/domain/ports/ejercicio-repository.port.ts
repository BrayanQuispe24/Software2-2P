import { Ejercicio, TipoEjercicio, GrupoMuscular, CrearEjercicioInput } from '../models/ejercicio.model';

export interface EjercicioRepositoryPort {
  listarEjercicios(tipoEjercicioId?: string, nivelDificultad?: string): Promise<Ejercicio[]>;
  listarTipos(): Promise<TipoEjercicio[]>;
  listarGruposMusculares(): Promise<GrupoMuscular[]>;
  crearEjercicio(input: CrearEjercicioInput): Promise<Ejercicio>;
}
