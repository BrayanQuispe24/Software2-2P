import { Mantenimiento, ProgramarMantenimientoParams } from '../models/mantenimiento.model';

export interface MantenimientoRepositoryPort {
  listarAlertas(diasMargen?: number): Promise<Mantenimiento[]>;
  listarPorEquipo(equipoId: string): Promise<Mantenimiento[]>;
  programar(params: ProgramarMantenimientoParams): Promise<Mantenimiento>;
  completar(id: string, costoFinal: number, observacion?: string): Promise<Mantenimiento>;
}
