import { EquipoRepositoryPort } from '../domain/ports/equipo-repository.port';
import { Equipo, CrearEquipoParams } from '../domain/models/equipo.model';

export class CrearEquipoUseCase {
  constructor(private readonly repository: EquipoRepositoryPort) {}

  execute(params: CrearEquipoParams): Promise<Equipo> {
    if (!params.codigo.trim() || !params.nombre.trim()) {
      throw new Error('El código y el nombre del equipo son obligatorios.');
    }
    if (params.cantidadInicial < 0) {
      throw new Error('La cantidad inicial no puede ser negativa.');
    }
    return this.repository.crear(params);
  }
}
