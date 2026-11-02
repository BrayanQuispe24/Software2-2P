import { Rutina, CrearRutinaInput } from '../models/rutina.model';

export interface RutinaRepositoryPort {
  listarRutinas(nivel?: string): Promise<Rutina[]>;
  obtenerRutinaPorId(id: string): Promise<Rutina | null>;
  crearRutina(input: CrearRutinaInput): Promise<Rutina>;
}
