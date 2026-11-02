import type { AuthUser } from '../../auth/domain/AuthUser';

export type EstadoMembresiaSocio = 'ACTIVA' | 'VENCIDA' | 'CONGELADA' | 'PENDIENTE';

export interface SocioProfile {
  user: AuthUser;
  codigoSocio: string;
  ciNumero: string;
  telefono: string;
  contactoEmergencia: string;
  tipoSangre: string;
  fechaIngreso: string;
  estadoMembresia: EstadoMembresiaSocio;
  sedePrincipal: string;
  dispositivoAsociado?: string;
}

export interface PlanDetalle {
  id: string;
  codigo?: string;
  nombre: string;
  duracionDias: number;
  sesionesTotales?: number;
  tipoAcceso: string;
}

export interface DisciplinaDetalle {
  id: string;
  nombre: string;
  colorHex?: string;
  capacidadMaxima?: number;
}

export interface HorarioDetalle {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  turno: string;
}

export interface BoletaPagoDetalle {
  id: string;
  numeroComprobante: string;
  montoTotal: number;
  metodoPago: string;
  estado: string;
  fechaPago?: string;
  codigoTransaccion?: string;
  comprobanteUrl?: string;
}

export interface BoletaInscripcionSocio {
  id: string;
  codigoMatricula: string;
  clienteId: string;
  fechaInicio: string;
  fechaFin: string;
  totalSesiones?: number;
  sesionesConsumidas: number;
  sesionesRestantes: number;
  diasRestantes: number;
  estado: EstadoMembresiaSocio;
  plan: PlanDetalle;
  disciplina?: DisciplinaDetalle;
  horario?: HorarioDetalle;
  boletaPago?: BoletaPagoDetalle;
  createdAt?: string;
}

export interface EjercicioPlan {
  id: string;
  nombre: string;
  nivelDificultad: string;
  patronMovimiento?: string;
  equipamiento?: string;
  urlVideo?: string;
  imagenes?: string[];
}

export interface RutinaEjercicioPlan {
  id: string;
  series: number;
  repeticiones: number;
  peso?: number;
  duracionSegundos?: number;
  descansoSegundos?: number;
  orden: number;
  observacion?: string;
  ejercicio: EjercicioPlan;
}

export interface RutinaPlan {
  id: string;
  nombre: string;
  nivel: string;
  estado: boolean;
  rutinaEjercicios: RutinaEjercicioPlan[];
}

export interface PlanEntrenamientoRutinaItem {
  id: string;
  diaSemana: string;
  rutina: RutinaPlan;
}

export interface PlanEntrenamientoSocio {
  id: string;
  idUsuario: string;
  nombre: string;
  objetivo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: boolean;
  observacion?: string;
  instructorNombre?: string;
  rutinasProgramadas: PlanEntrenamientoRutinaItem[];
}

export interface ComidaPlanAlimentacion {
  id: string;
  diaSemana: string;
  tipoComida: string;
  alimento: string;
  cantidad: number;
  unidad: string;
  hora?: string;
  calorias?: number;
  proteinas?: number;
  carbohidratos?: number;
  grasas?: number;
  observacion?: string;
}

export interface PlanAlimentacionSocio {
  id: string;
  idUsuario: string;
  nombre: string;
  objetivo: string;
  fechaInicio: string;
  fechaFin: string;
  observacion?: string;
  estado: boolean;
  comidas: ComidaPlanAlimentacion[];
}
