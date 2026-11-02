import { ICatalogoRepository, ActualizarPlanInput } from '../../domain/repositories/catalogo.repository';
import { Plan } from '../../domain/models/plan.model';

export class ActualizarPlanUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(id: string, input: ActualizarPlanInput): Promise<Plan> {
    return this.repository.actualizarPlan(id, input);
  }
}

export class EliminarPlanUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(id: string): Promise<boolean> {
    return this.repository.eliminarPlan(id);
  }
}
