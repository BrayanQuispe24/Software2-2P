export interface TipoMovimientoRef {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface MovimientoInventario {
  id: string;
  fechaHora: string;
  motivo: string;
  observacion?: string;
  cantidad: number;
  equipoId: string;
  equipoNombre?: string;
  tipoMovimiento: TipoMovimientoRef;
  usuarioId?: string;
}

export interface RegistrarMovimientoParams {
  equipoId: string;
  tipoMovimientoId: string;
  cantidad: number;
  motivo: string;
  observacion?: string;
}
