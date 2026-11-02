import { MantenimientoRepositoryPort } from '../domain/ports/mantenimiento-repository.port';
import { Mantenimiento } from '../domain/models/mantenimiento.model';

export class ConsultarAlertasMantenimientoUseCase {
  constructor(private readonly repository: MantenimientoRepositoryPort) {}

  execute(diasMargen = 7): Promise<Mantenimiento[]> {
    return this.repository.listarAlertas(diasMargen);
  }
}
