export interface DetalleHistorial {
  id?: string;
  peso: number;
  altura: number;
  imc: number;
  porcentajeGasa?: number;
  masaMuscular?: number;
  presion?: string;
  fechaRegistro: string;
}

export interface Historial {
  id: string;
  idUsuario: string;
  fechaApertura: string;
  observacionesGenerales?: string;
  grupoSanguineo?: string;
  sexo?: string;
  fechaNacimiento?: string;
  domicilio?: string;
  facultadCarrera?: string;
  celularEmergencia?: string;
  detalles: DetalleHistorial[];
}

export interface RegistrarMedicionInput {
  idUsuario: string;
  peso: number;
  altura: number;
  porcentajeGrasa?: number;
  masaMuscular?: number;
  presion?: string;
}
