import { MovimientoRepositoryPort } from '../domain/ports/movimiento-repository.port';
import { MovimientoInventario } from '../domain/models/movimiento.model';

export class ConsultarKardexUseCase {
  constructor(private readonly repository: MovimientoRepositoryPort) {}

  execute(equipoId: string): Promise<MovimientoInventario[]> {
    return this.repository.consultarKardex(equipoId);
  }
}
