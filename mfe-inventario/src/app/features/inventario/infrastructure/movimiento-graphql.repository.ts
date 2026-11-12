import { Injectable } from '@angular/core';
import { MovimientoRepositoryPort } from '../domain/ports/movimiento-repository.port';
import { MovimientoInventario, RegistrarMovimientoParams, TipoMovimientoRef } from '../domain/models/movimiento.model';
import { GraphQLClientService, isOfflineOrNetworkError } from '../../../core/graphql/graphql.client';
import { KARDEX_QUERY, REGISTRAR_MOVIMIENTO_MUTATION, TIPOS_MOVIMIENTO_QUERY } from './movimiento-queries.graphql';

function getGlobalSyncEngine(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).__APEX_SYNC_ENGINE__ || (window.parent as any)?.__APEX_SYNC_ENGINE__ || null;
}

@Injectable({
  providedIn: 'root',
})
export class MovimientoGraphQLRepository implements MovimientoRepositoryPort {
  constructor(private readonly client: GraphQLClientService) {}

  async consultarKardex(equipoId: string): Promise<MovimientoInventario[]> {
    try {
      const data = await this.client.query<any>(KARDEX_QUERY, { equipoId });
      const list = data?.kardexPorEquipo || [];
      return list.map(this.mapDtoToModel);
    } catch (err) {
      if (isOfflineOrNetworkError(err)) {
        return [];
      }
      throw err;
    }
  }

  async registrarMovimiento(params: RegistrarMovimientoParams): Promise<MovimientoInventario> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.enqueueMovimientoOffline(params);
    }

    try {
      const data = await this.client.query<any>(REGISTRAR_MOVIMIENTO_MUTATION, { input: params });
      return this.mapDtoToModel(data.registrarMovimientoInventario);
    } catch (error) {
      if (isOfflineOrNetworkError(error)) {
        return this.enqueueMovimientoOffline(params);
      }
      throw error;
    }
  }

  private async enqueueMovimientoOffline(params: RegistrarMovimientoParams): Promise<MovimientoInventario> {
    const localId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mov_${Date.now()}`;
    const syncEngine = getGlobalSyncEngine();

    if (syncEngine && typeof syncEngine.enqueueMutation === 'function') {
      try {
        await syncEngine.enqueueMutation({
          entityType: 'MOVIMIENTO_KARDEX',
          operationType: 'CREATE',
          endpoint: '/graphql/inventario',
          httpMethod: 'POST',
          payload: {
            query: REGISTRAR_MOVIMIENTO_MUTATION,
            variables: { input: params },
          },
        });
      } catch (err) {
        console.warn('[MovimientoGraphQLRepository] Error al encolar en SyncEngine:', err);
      }
    }

    return {
      id: localId,
      fechaHora: new Date().toISOString(),
      motivo: params.motivo,
      observacion: params.observacion,
      cantidad: Number(params.cantidad),
      equipoId: params.equipoId,
      tipoMovimiento: {
        id: params.tipoMovimientoId,
        nombre: 'Movimiento Local',
      },
    };
  }

  async listarTiposMovimiento(): Promise<TipoMovimientoRef[]> {
    try {
      const data = await this.client.query<any>(TIPOS_MOVIMIENTO_QUERY);
      return data?.tiposMovimiento || [];
    } catch (err) {
      if (isOfflineOrNetworkError(err)) {
        return [
          { id: 'mov-1', nombre: 'ENTRADA', descripcion: 'Entrada de equipo' },
          { id: 'mov-2', nombre: 'SALIDA', descripcion: 'Salida de equipo' },
          { id: 'mov-3', nombre: 'AJUSTE', descripcion: 'Ajuste de inventario' },
        ];
      }
      throw err;
    }
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

