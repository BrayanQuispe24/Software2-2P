import { Injectable } from '@angular/core';
import { MovimientoRepositoryPort } from '../domain/ports/movimiento-repository.port';
import { MovimientoInventario, RegistrarMovimientoParams, TipoMovimientoRef } from '../domain/models/movimiento.model';
import { GraphQLClientService } from '../../../core/graphql/graphql.client';
import { KARDEX_QUERY, REGISTRAR_MOVIMIENTO_MUTATION, TIPOS_MOVIMIENTO_QUERY } from './movimiento-queries.graphql';

@Injectable({
  providedIn: 'root',
})
export class MovimientoGraphQLRepository implements MovimientoRepositoryPort {
  constructor(private readonly client: GraphQLClientService) {}

  async consultarKardex(equipoId: string): Promise<MovimientoInventario[]> {
    const data = await this.client.query<any>(KARDEX_QUERY, { equipoId });
    const list = data?.kardexPorEquipo || [];
    return list.map(this.mapDtoToModel);
  }

  async registrarMovimiento(params: RegistrarMovimientoParams): Promise<MovimientoInventario> {
    const data = await this.client.query<any>(REGISTRAR_MOVIMIENTO_MUTATION, { input: params });
    return this.mapDtoToModel(data.registrarMovimientoInventario);
  }

  async listarTiposMovimiento(): Promise<TipoMovimientoRef[]> {
    const data = await this.client.query<any>(TIPOS_MOVIMIENTO_QUERY);
    return data?.tiposMovimiento || [];
  }

  private mapDtoToModel(dto: any): MovimientoInventario {
    return {
      id: dto.id,
      fechaHora: dto.fechaHora,
      motivo: dto.motivo,
      observacion: dto.observacion || undefined,
      cantidad: Number(dto.cantidad),
      equipoId: dto.equipo?.id || '',
      equipoNombre: dto.equipo?.nombre,
      tipoMovimiento: {
        id: dto.tipoMovimiento?.id || '',
        nombre: dto.tipoMovimiento?.nombre || 'General',
        descripcion: dto.tipoMovimiento?.descripcion,
      },
      usuarioId: dto.usuarioId || undefined,
    };
  }
}
