export interface DatosPagoEfectivoInput {
  montoRecibido: number;
}

export interface DatosPagoQrInput {
  comprobanteUrl: string;
  codigoTransaccion?: string;
}

export interface DatosPagoStripeInput {
  numeroTarjeta?: string;
  expiracionMes?: string;
  expiracionAnio?: string;
  cvc?: string;
  titular?: string;
  stripePaymentMethodId?: string;
}

export interface FormularioPagoState {
  // Efectivo
  montoRecibido: number | null;
  cambioCalculado: number;
  
  // QR
  comprobanteUrl: string;
  comprobanteNombre: string;
  comprobantePreviewBase64: string | null;
  codigoTransaccionQr: string;
  
  // Stripe / Tarjeta
  numeroTarjeta: string;
  expiracionMes: string;
  expiracionAnio: string;
  cvc: string;
  titular: string;
  stripeProcessing: boolean;
  stripeSuccessMessage: string | null;
}
