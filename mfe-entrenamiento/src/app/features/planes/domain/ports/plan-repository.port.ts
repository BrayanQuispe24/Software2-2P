import { PlanEntrenamiento, AsignarPlanEntrenamientoInput } from '../models/plan.model';

export interface PlanRepositoryPort {
  obtenerPlanActivo(usuarioId: string): Promise<PlanEntrenamiento | null>;
  asignarPlan(input: AsignarPlanEntrenamientoInput): Promise<PlanEntrenamiento>;
}
