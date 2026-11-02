import { TipoMovimientoAcceso, EstadoAcceso } from '../enums/acceso.enums';

export interface RegistroAcceso {
  id: string;
  clienteId: string;
  tipoMovimiento: TipoMovimientoAcceso;
  estadoAcceso: EstadoAcceso;
  fechaHora: string;
  dispositivoTorniquete?: string;
  motivoDenegacion?: string;
}

export interface ValidacionAccesoResult {
  permitido: boolean;
  mensaje: string;
  clienteId: string;
  codigoMatricula?: string;
  planNombre?: string;
  sesionesRestantes?: number;
  diasRestantes?: number;
  registroAcceso: RegistroAcceso;
}
