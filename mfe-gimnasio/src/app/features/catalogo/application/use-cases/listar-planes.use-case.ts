import { ICatalogoRepository } from '../../domain/repositories/catalogo.repository';
import { Plan } from '../../domain/models/plan.model';

export class ListarPlanesUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(soloActivos: boolean = true): Promise<Plan[]> {
    return this.repository.listarPlanes(soloActivos);
  }
}
