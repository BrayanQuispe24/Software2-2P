import { IControlAccesoRepository, ValidarAccesoTorniqueteInput } from '../../domain/repositories/control-acceso.repository';
import { ValidacionAccesoResult } from '../../domain/models/acceso.model';

export class ValidarAccesoTorniqueteUseCase {
  constructor(private readonly repository: IControlAccesoRepository) {}

  execute(input: ValidarAccesoTorniqueteInput): Promise<ValidacionAccesoResult> {
    if (!input.clienteId) {
      throw new Error('Identificador del cliente es requerido para validar acceso.');
    }
    return this.repository.validarAccesoTorniquete(input);
  }
}
