import { IControlAccesoRepository } from '../../domain/repositories/control-acceso.repository';
import { RegistroAcceso } from '../../domain/models/acceso.model';

export class ListarAuditoriaAccesosUseCase {
  constructor(private readonly repository: IControlAccesoRepository) {}

  execute(clienteId?: string, limite: number = 50): Promise<RegistroAcceso[]> {
    return this.repository.listarRegistrosAcceso(clienteId, limite);
  }
}
