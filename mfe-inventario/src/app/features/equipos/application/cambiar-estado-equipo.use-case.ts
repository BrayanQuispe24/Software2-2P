import { EquipoRepositoryPort } from '../domain/ports/equipo-repository.port';
import { Equipo } from '../domain/models/equipo.model';
import { EstadoEquipo } from '../domain/enums/estado-equipo.enum';

export class CambiarEstadoEquipoUseCase {
  constructor(private readonly repository: EquipoRepositoryPort) {}

  execute(id: string, nuevoEstado: EstadoEquipo): Promise<Equipo> {
    return this.repository.actualizarEstado(id, nuevoEstado);
  }
}
