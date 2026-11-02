import { ICatalogoRepository, ActualizarTarifaInput, CrearTarifaInput } from '../../domain/repositories/catalogo.repository';
import { Tarifa } from '../../domain/models/plan.model';

export class ActualizarTarifaUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(id: string, input: ActualizarTarifaInput): Promise<Tarifa> {
    return this.repository.actualizarTarifa(id, input);
  }
}

export class EliminarTarifaUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(id: string): Promise<boolean> {
    return this.repository.eliminarTarifa(id);
  }
}

export class CrearTarifaUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(input: CrearTarifaInput): Promise<Tarifa> {
    return this.repository.crearTarifa(input);
  }
}
