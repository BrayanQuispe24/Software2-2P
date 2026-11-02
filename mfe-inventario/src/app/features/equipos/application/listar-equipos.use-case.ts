import { EquipoRepositoryPort } from '../domain/ports/equipo-repository.port';
import { Equipo } from '../domain/models/equipo.model';
import { EstadoEquipo } from '../domain/enums/estado-equipo.enum';

export class ListarEquiposUseCase {
  constructor(private readonly repository: EquipoRepositoryPort) {}

  execute(estado?: EstadoEquipo, ambienteId?: string, marcaId?: string): Promise<Equipo[]> {
    return this.repository.listar(estado, ambienteId, marcaId);
  }
}
