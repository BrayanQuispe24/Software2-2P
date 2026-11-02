import { IInscripcionRepository } from '../../domain/repositories/inscripcion.repository';
import { BoletaInscripcion } from '../../domain/models/inscripcion.model';

export class CongelarInscripcionUseCase {
  constructor(private readonly repository: IInscripcionRepository) {}

  execute(id: string, motivo?: string): Promise<BoletaInscripcion> {
    return this.repository.congelarInscripcion(id, motivo);
  }

  reactivar(id: string): Promise<BoletaInscripcion> {
    return this.repository.reactivarInscripcion(id);
  }
}
