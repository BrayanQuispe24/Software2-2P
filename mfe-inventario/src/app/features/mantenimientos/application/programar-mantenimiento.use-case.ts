import { MantenimientoRepositoryPort } from '../domain/ports/mantenimiento-repository.port';
import { Mantenimiento, ProgramarMantenimientoParams } from '../domain/models/mantenimiento.model';

export class ProgramarMantenimientoUseCase {
  constructor(private readonly repository: MantenimientoRepositoryPort) {}

  execute(params: ProgramarMantenimientoParams): Promise<Mantenimiento> {
    if (!params.equipoId) {
      throw new Error('El equipo es obligatorio para programar un mantenimiento.');
    }
    if (!params.descripcion.trim()) {
      throw new Error('La descripción del mantenimiento es obligatoria.');
    }
    return this.repository.programar(params);
  }
}
