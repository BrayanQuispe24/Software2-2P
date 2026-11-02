import { BoletaInscripcion, BoletaPago } from '../models/inscripcion.model';
import { EstadoInscripcion, MetodoPago } from '../enums/inscripcion.enums';
import {
  DatosPagoEfectivoInput,
  DatosPagoQrInput,
  DatosPagoStripeInput,
} from '../models/pago-estrategia.model';

export interface ProcesarInscripcionInput {
  clienteId: string;
  planId: string;
  tarifaId: string;
  disciplinaId?: string;
  disciplinaHorarioId?: string;
  fechaInicio: string;
  metodoPago: MetodoPago;
  montoDescuento?: number;
  codigoTransaccionExterna?: string;
  comprobanteUrl?: string;
  datosEfectivo?: DatosPagoEfectivoInput;
  datosQr?: DatosPagoQrInput;
  datosStripe?: DatosPagoStripeInput;
}

export interface ConfirmarPagoInput {
  boletaPagoId: string;
  metodoPago?: MetodoPago;
  codigoTransaccionExterna?: string;
  comprobanteUrl?: string;
  datosEfectivo?: DatosPagoEfectivoInput;
  datosQr?: DatosPagoQrInput;
  datosStripe?: DatosPagoStripeInput;
}

export interface IInscripcionRepository {
  listarInscripciones(clienteId?: string, estado?: EstadoInscripcion): Promise<BoletaInscripcion[]>;
  procesarInscripcion(input: ProcesarInscripcionInput): Promise<BoletaInscripcion>;
  congelarInscripcion(id: string, motivo?: string): Promise<BoletaInscripcion>;
  reactivarInscripcion(id: string): Promise<BoletaInscripcion>;
}

export interface IPagoRepository {
  listarPagosPorCliente(clienteId: string): Promise<BoletaPago[]>;
  confirmarPago(input: ConfirmarPagoInput): Promise<BoletaPago>;
}
