import { RegistroAcceso, ValidacionAccesoResult } from '../models/acceso.model';
import { TipoMovimientoAcceso } from '../enums/acceso.enums';

export interface ValidarAccesoTorniqueteInput {
  clienteId: string;
  dispositivoTorniquete?: string;
  tipoMovimiento?: TipoMovimientoAcceso;
}

export interface ValidarAccesoQrInput {
  qrPayload: string;
  dispositivoTorniquete?: string;
  tipoMovimiento?: TipoMovimientoAcceso;
}

export interface IControlAccesoRepository {
  validarAccesoTorniquete(input: ValidarAccesoTorniqueteInput): Promise<ValidacionAccesoResult>;
  validarAccesoPorQr(input: ValidarAccesoQrInput): Promise<ValidacionAccesoResult>;
  obtenerQrPaseDigital(inscripcionId: string): Promise<string>;
  listarRegistrosAcceso(clienteId?: string, limite?: number): Promise<RegistroAcceso[]>;
}
