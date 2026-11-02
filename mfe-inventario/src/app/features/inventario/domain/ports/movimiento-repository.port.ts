import { MovimientoInventario, RegistrarMovimientoParams, TipoMovimientoRef } from '../models/movimiento.model';

export interface MovimientoRepositoryPort {
  consultarKardex(equipoId: string): Promise<MovimientoInventario[]>;
  registrarMovimiento(params: RegistrarMovimientoParams): Promise<MovimientoInventario>;
  listarTiposMovimiento(): Promise<TipoMovimientoRef[]>;
}
