import { IInscripcionRepository } from '../../domain/repositories/inscripcion.repository';
import { BoletaInscripcion } from '../../domain/models/inscripcion.model';
import { EstadoInscripcion } from '../../domain/enums/inscripcion.enums';

export class ListarInscripcionesUseCase {
  constructor(private readonly repository: IInscripcionRepository) {}

  execute(clienteId?: string, estado?: EstadoInscripcion): Promise<BoletaInscripcion[]> {
    return this.repository.listarInscripciones(clienteId, estado);
  }
}
