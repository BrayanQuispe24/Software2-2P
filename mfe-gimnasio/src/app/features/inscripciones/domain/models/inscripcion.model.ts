import { EstadoInscripcion, MetodoPago, EstadoPago } from '../enums/inscripcion.enums';
import { Plan } from '../../../catalogo/domain/models/plan.model';
import { Disciplina, DisciplinaHorario } from '../../../catalogo/domain/models/disciplina.model';

export interface BoletaInscripcion {
  id: string;
  codigoMatricula: string;
  clienteId: string;
  planId?: string;
  plan?: Plan;
  disciplinaId?: string;
  disciplina?: Disciplina;
  disciplinaHorarioId?: string;
  disciplinaHorario?: DisciplinaHorario;
  fechaInicio: string;
  fechaFin: string;
  totalSesiones?: number;
  sesionesConsumidas: number;
  estado: EstadoInscripcion;
  boletaPago?: BoletaPago;
  createdAt?: string;
}

export interface BoletaPago {
  id: string;
  boletaInscripcionId: string;
  tarifaId?: string;
  numeroComprobante: string;
  montoSubtotal: number;
  montoDescuento: number;
  montoTotal: number;
  metodoPago: MetodoPago;
  estado: EstadoPago;
  codigoTransaccionExterna?: string;
  fechaPago?: string;
  comprobanteUrl?: string;
  createdAt?: string;
}
