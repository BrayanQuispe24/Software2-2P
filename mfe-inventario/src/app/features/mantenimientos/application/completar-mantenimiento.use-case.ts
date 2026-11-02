import { MantenimientoRepositoryPort } from '../domain/ports/mantenimiento-repository.port';
import { Mantenimiento } from '../domain/models/mantenimiento.model';

export class CompletarMantenimientoUseCase {
  constructor(private readonly repository: MantenimientoRepositoryPort) {}

  execute(id: string, costoFinal: number, observacion?: string): Promise<Mantenimiento> {
    if (costoFinal < 0) {
      throw new Error('El costo final no puede ser negativo.');
    }
    return this.repository.completar(id, costoFinal, observacion);
  }
}
