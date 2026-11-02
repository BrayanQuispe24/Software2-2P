export enum EstadoInscripcion {
  ACTIVA = 'ACTIVA',
  CONGELADA = 'CONGELADA',
  VENCIDA = 'VENCIDA',
  CANCELADA = 'CANCELADA',
}

export enum MetodoPago {
  QR = 'QR',
  TRANSFERENCIA = 'TRANSFERENCIA',
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
}

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  PAGADO = 'PAGADO',
  RECHAZADO = 'RECHAZADO',
  ANULADO = 'ANULADO',
}
