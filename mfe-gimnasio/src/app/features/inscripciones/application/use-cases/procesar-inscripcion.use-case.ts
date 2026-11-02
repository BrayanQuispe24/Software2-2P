import { IInscripcionRepository, ProcesarInscripcionInput } from '../../domain/repositories/inscripcion.repository';
import { BoletaInscripcion } from '../../domain/models/inscripcion.model';

export class ProcesarInscripcionUseCase {
  constructor(private readonly repository: IInscripcionRepository) {}

  execute(input: ProcesarInscripcionInput): Promise<BoletaInscripcion> {
    if (!input.clienteId || !input.planId || !input.tarifaId || !input.fechaInicio) {
      throw new Error('Todos los campos requeridos para la matrícula deben ser provistos.');
    }
    return this.repository.procesarInscripcion(input);
  }
}
