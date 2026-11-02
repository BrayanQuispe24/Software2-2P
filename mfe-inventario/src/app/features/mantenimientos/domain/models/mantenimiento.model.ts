import { TipoMantenimiento, EstadoMantenimiento } from '../enums/mantenimiento.enums';

export interface Mantenimiento {
  id: string;
  tipo: TipoMantenimiento;
  fechaInicio: string;
  fechaFin?: string;
  descripcion: string;
  costo: number;
  estado: EstadoMantenimiento;
  proximoMantenimiento?: string;
  observacion?: string;
  equipoId: string;
  equipoNombre?: string;
}

export interface ProgramarMantenimientoParams {
  equipoId: string;
  tipo: TipoMantenimiento;
  fechaInicio: string;
  descripcion: string;
  costoEstimado?: number;
  proximoMantenimiento?: string;
  observacion?: string;
}
