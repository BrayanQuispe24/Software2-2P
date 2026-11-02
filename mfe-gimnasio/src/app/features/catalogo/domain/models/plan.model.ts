import { TipoAccesoPlan } from '../enums/tipo-acceso-plan.enum';

export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  duracionDias: number;
  sesionesTotales?: number;
  tipoAcceso: TipoAccesoPlan;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  tarifas?: Tarifa[];
}

export interface Tarifa {
  id: string;
  planId?: string;
  nombre: string;
  monto: number;
  moneda: string;
  matriculaInscripcion: number;
  fechaInicio: string;
  fechaFin?: string;
  activa: boolean;
}
