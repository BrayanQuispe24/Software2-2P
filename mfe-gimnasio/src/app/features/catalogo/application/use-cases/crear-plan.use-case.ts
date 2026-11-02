import { ICatalogoRepository, CrearPlanInput, CrearTarifaInput } from '../../domain/repositories/catalogo.repository';
import { Plan } from '../../domain/models/plan.model';

export class CrearPlanUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  async execute(planInput: CrearPlanInput, tarifaMonto?: number): Promise<Plan> {
    if (!planInput.codigo || !planInput.nombre || planInput.duracionDias <= 0) {
      throw new Error('Código, nombre y duración en días son obligatorios.');
    }
    const plan = await this.repository.crearPlan(planInput);

    if (tarifaMonto !== undefined && tarifaMonto > 0) {
      const tarifaInput: CrearTarifaInput = {
        planId: plan.id,
        nombre: `Tarifa Estándar ${plan.nombre}`,
        monto: tarifaMonto,
        moneda: 'BOB',
        matriculaInscripcion: 0,
        fechaInicio: new Date().toISOString().split('T')[0],
      };
      await this.repository.crearTarifa(tarifaInput);
    }

    return plan;
  }
}
