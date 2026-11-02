import { Equipo, CrearEquipoParams, AmbienteRef, MarcaRef, TipoEquipoRef } from '../models/equipo.model';
import { EstadoEquipo } from '../enums/estado-equipo.enum';

export interface EquipoRepositoryPort {
  listar(estado?: EstadoEquipo, ambienteId?: string, marcaId?: string): Promise<Equipo[]>;
  obtenerPorId(id: string): Promise<Equipo | null>;
  crear(params: CrearEquipoParams): Promise<Equipo>;
  actualizarEstado(id: string, nuevoEstado: EstadoEquipo): Promise<Equipo>;
  listarAmbientes(): Promise<AmbienteRef[]>;
  crearAmbiente(nombre: string, descripcion?: string): Promise<AmbienteRef>;
  listarMarcas(): Promise<MarcaRef[]>;
  crearMarca(nombre: string): Promise<MarcaRef>;
  listarTiposEquipo(): Promise<TipoEquipoRef[]>;
}
