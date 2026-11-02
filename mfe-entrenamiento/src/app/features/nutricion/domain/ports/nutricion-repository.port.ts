import { PlanAlimentacion, AsignarPlanAlimentacionInput } from '../models/nutricion.model';

export interface NutricionRepositoryPort {
  obtenerPlanActivo(usuarioId: string): Promise<PlanAlimentacion | null>;
  asignarPlan(input: AsignarPlanAlimentacionInput): Promise<PlanAlimentacion>;
}
