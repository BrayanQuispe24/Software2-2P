import { MovimientoRepositoryPort } from '../domain/ports/movimiento-repository.port';
import { MovimientoInventario, RegistrarMovimientoParams } from '../domain/models/movimiento.model';

export class RegistrarMovimientoUseCase {
  constructor(private readonly repository: MovimientoRepositoryPort) {}

  execute(params: RegistrarMovimientoParams): Promise<MovimientoInventario> {
    if (params.cantidad <= 0) {
      throw new Error('La cantidad de movimiento debe ser estrictamente mayor a 0.');
    }
    if (!params.motivo.trim()) {
      throw new Error('El motivo del movimiento es obligatorio.');
    }
    return this.repository.registrarMovimiento(params);
  }
}
