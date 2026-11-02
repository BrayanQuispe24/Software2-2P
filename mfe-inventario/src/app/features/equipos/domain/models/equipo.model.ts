import { EstadoEquipo } from '../enums/estado-equipo.enum';

export interface AmbienteRef {
  id: string;
  nombre: string;
  descripcion?: string;
  estado?: string;
}

export interface MarcaRef {
  id: string;
  nombre: string;
  estado?: string;
}

export interface TipoEquipoRef {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Equipo {
  id: string;
  codigo: string;
  nombre: string;
  modelo?: string;
  fechaAdquisicion?: string;
  precioCompra?: number;
  estado: EstadoEquipo;
  cantidad: number;
  ambiente: AmbienteRef;
  marca: MarcaRef;
  tipoEquipo: TipoEquipoRef;
}

export interface CrearEquipoParams {
  codigo: string;
  nombre: string;
  modelo?: string;
  fechaAdquisicion?: string;
  precioCompra?: number;
  cantidadInicial: number;
  ambienteId: string;
  marcaId: string;
  tipoEquipoId: string;
}
