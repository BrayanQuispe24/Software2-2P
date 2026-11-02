import { Historial, DetalleHistorial, RegistrarMedicionInput } from '../models/antropometria.model';

export interface AntropometriaRepositoryPort {
  obtenerHistorial(usuarioId: string): Promise<Historial | null>;
  registrarMedicion(input: RegistrarMedicionInput): Promise<DetalleHistorial>;
}
