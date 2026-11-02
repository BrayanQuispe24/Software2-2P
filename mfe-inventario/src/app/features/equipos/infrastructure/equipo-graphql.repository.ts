import { Injectable } from '@angular/core';
import { EquipoRepositoryPort } from '../domain/ports/equipo-repository.port';
import { Equipo, CrearEquipoParams, AmbienteRef, MarcaRef, TipoEquipoRef } from '../domain/models/equipo.model';
import { EstadoEquipo } from '../domain/enums/estado-equipo.enum';
import { GraphQLClientService } from '../../../core/graphql/graphql.client';
import {
  EQUIPOS_QUERY,
  CREAR_EQUIPO_MUTATION,
  ACTUALIZAR_ESTADO_EQUIPO_MUTATION,
  CATALOGOS_QUERY,
  CREAR_AMBIENTE_MUTATION,
  CREAR_MARCA_MUTATION,
} from './equipo-queries.graphql';
import { EquipoMapper } from './equipo.mapper';

@Injectable({
  providedIn: 'root',
})
export class EquipoGraphQLRepository implements EquipoRepositoryPort {
  constructor(private readonly client: GraphQLClientService) {}

  async listar(estado?: EstadoEquipo, ambienteId?: string, marcaId?: string): Promise<Equipo[]> {
    const data = await this.client.query<any>(EQUIPOS_QUERY, { estado, ambienteId, marcaId });
    const list = data?.equipos?.data || data?.equipos || [];
    return list.map((item: any) => EquipoMapper.toDomain(item));
  }

  async obtenerPorId(id: string): Promise<Equipo | null> {
    const query = `
      query EquipoPorId($id: ID!) {
        equipoPorId(id: $id) {
          id
          codigo
          nombre
          modelo
          fechaAdquisicion
          precioCompra
          estado
          cantidad
          ambiente { id nombre }
          marca { id nombre }
          tipoEquipo { id nombre }
        }
      }
    `;
    const data = await this.client.query<any>(query, { id });
    return data?.equipoPorId ? EquipoMapper.toDomain(data.equipoPorId) : null;
  }

  async crear(params: CrearEquipoParams): Promise<Equipo> {
    const data = await this.client.query<any>(CREAR_EQUIPO_MUTATION, { input: params });
    return EquipoMapper.toDomain(data.crearEquipo);
  }

  async actualizarEstado(id: string, nuevoEstado: EstadoEquipo): Promise<Equipo> {
    const data = await this.client.query<any>(ACTUALIZAR_ESTADO_EQUIPO_MUTATION, { id, nuevoEstado });
    return data.actualizarEstadoEquipo;
  }

  async listarAmbientes(): Promise<AmbienteRef[]> {
    const data = await this.client.query<any>(CATALOGOS_QUERY);
    return data?.ambientes || [];
  }

  async crearAmbiente(nombre: string, descripcion?: string): Promise<AmbienteRef> {
    const data = await this.client.query<any>(CREAR_AMBIENTE_MUTATION, { nombre, descripcion });
    return data?.crearAmbiente;
  }

  async listarMarcas(): Promise<MarcaRef[]> {
    const data = await this.client.query<any>(CATALOGOS_QUERY);
    return data?.marcas || [];
  }

  async crearMarca(nombre: string): Promise<MarcaRef> {
    const data = await this.client.query<any>(CREAR_MARCA_MUTATION, { nombre });
    return data?.crearMarca;
  }

  async listarTiposEquipo(): Promise<TipoEquipoRef[]> {
    const data = await this.client.query<any>(CATALOGOS_QUERY);
    return data?.tiposEquipo || [];
  }
}
