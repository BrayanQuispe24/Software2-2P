import { Injectable } from '@angular/core';
import { MantenimientoRepositoryPort } from '../domain/ports/mantenimiento-repository.port';
import { Mantenimiento, ProgramarMantenimientoParams } from '../domain/models/mantenimiento.model';
import { TipoMantenimiento, EstadoMantenimiento } from '../domain/enums/mantenimiento.enums';
import { GraphQLClientService } from '../../../core/graphql/graphql.client';
import {
  ALERTAS_MANTENIMIENTO_QUERY,
  MANTENIMIENTOS_POR_EQUIPO_QUERY,
  PROGRAMAR_MANTENIMIENTO_MUTATION,
  COMPLETAR_MANTENIMIENTO_MUTATION,
} from './mantenimiento-queries.graphql';

@Injectable({
  providedIn: 'root',
})
export class MantenimientoGraphQLRepository implements MantenimientoRepositoryPort {
  constructor(private readonly client: GraphQLClientService) {}

  async listarAlertas(diasMargen = 7): Promise<Mantenimiento[]> {
    const data = await this.client.query<any>(ALERTAS_MANTENIMIENTO_QUERY, { diasMargen });
    const list = data?.alertasMantenimientoProximo || [];
    return list.map(this.mapDtoToModel);
  }

  async listarPorEquipo(equipoId: string): Promise<Mantenimiento[]> {
    const data = await this.client.query<any>(MANTENIMIENTOS_POR_EQUIPO_QUERY, { equipoId });
    const list = data?.mantenimientos || [];
    return list.map(this.mapDtoToModel);
  }

  async programar(params: ProgramarMantenimientoParams): Promise<Mantenimiento> {
    const data = await this.client.query<any>(PROGRAMAR_MANTENIMIENTO_MUTATION, { input: params });
    return this.mapDtoToModel(data.programarMantenimiento);
  }

  async completar(id: string, costoFinal: number, observacion?: string): Promise<Mantenimiento> {
    const data = await this.client.query<any>(COMPLETAR_MANTENIMIENTO_MUTATION, {
      id,
      costoFinal,
      observacion,
    });
    return this.mapDtoToModel(data.completarMantenimiento);
  }

  private mapDtoToModel(dto: any): Mantenimiento {
    return {
      id: dto.id,
      tipo: dto.tipo as TipoMantenimiento,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin || undefined,
      descripcion: dto.descripcion,
      costo: Number(dto.costo || 0),
      estado: dto.estado as EstadoMantenimiento,
      proximoMantenimiento: dto.proximoMantenimiento || undefined,
      observacion: dto.observacion || undefined,
      equipoId: dto.equipo?.id || '',
      equipoNombre: dto.equipo ? `${dto.equipo.codigo ? '[' + dto.equipo.codigo + '] ' : ''}${dto.equipo.nombre}` : undefined,
    };
  }
}
