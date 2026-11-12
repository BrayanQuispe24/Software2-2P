import { Injectable } from '@angular/core';
import { MantenimientoRepositoryPort } from '../domain/ports/mantenimiento-repository.port';
import { Mantenimiento, ProgramarMantenimientoParams } from '../domain/models/mantenimiento.model';
import { TipoMantenimiento, EstadoMantenimiento } from '../domain/enums/mantenimiento.enums';
import { GraphQLClientService, isOfflineOrNetworkError } from '../../../core/graphql/graphql.client';
import {
  ALERTAS_MANTENIMIENTO_QUERY,
  MANTENIMIENTOS_POR_EQUIPO_QUERY,
  PROGRAMAR_MANTENIMIENTO_MUTATION,
  COMPLETAR_MANTENIMIENTO_MUTATION,
} from './mantenimiento-queries.graphql';

function getGlobalSyncEngine(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).__APEX_SYNC_ENGINE__ || (window.parent as any)?.__APEX_SYNC_ENGINE__ || null;
}

@Injectable({
  providedIn: 'root',
})
export class MantenimientoGraphQLRepository implements MantenimientoRepositoryPort {
  constructor(private readonly client: GraphQLClientService) {}

  async listarAlertas(diasMargen = 7): Promise<Mantenimiento[]> {
    try {
      const data = await this.client.query<any>(ALERTAS_MANTENIMIENTO_QUERY, { diasMargen });
      const list = data?.alertasMantenimientoProximo || [];
      return list.map(this.mapDtoToModel);
    } catch (err) {
      if (isOfflineOrNetworkError(err)) {
        return [];
      }
      throw err;
    }
  }

  async listarPorEquipo(equipoId: string): Promise<Mantenimiento[]> {
    try {
      const data = await this.client.query<any>(MANTENIMIENTOS_POR_EQUIPO_QUERY, { equipoId });
      const list = data?.mantenimientos || [];
      return list.map(this.mapDtoToModel);
    } catch (err) {
      if (isOfflineOrNetworkError(err)) {
        return [];
      }
      throw err;
    }
  }

  async programar(params: ProgramarMantenimientoParams): Promise<Mantenimiento> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.enqueueProgramarOffline(params);
    }

    try {
      const data = await this.client.query<any>(PROGRAMAR_MANTENIMIENTO_MUTATION, { input: params });
      return this.mapDtoToModel(data.programarMantenimiento);
    } catch (error) {
      if (isOfflineOrNetworkError(error)) {
        return this.enqueueProgramarOffline(params);
      }
      throw error;
    }
  }

  private async enqueueProgramarOffline(params: ProgramarMantenimientoParams): Promise<Mantenimiento> {
    const localId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `maint_${Date.now()}`;
    const syncEngine = getGlobalSyncEngine();

    if (syncEngine && typeof syncEngine.enqueueMutation === 'function') {
      try {
        await syncEngine.enqueueMutation({
          entityType: 'MANTENIMIENTO',
          operationType: 'CREATE',
          endpoint: '/graphql/inventario',
          httpMethod: 'POST',
          payload: {
            query: PROGRAMAR_MANTENIMIENTO_MUTATION,
            variables: { input: params },
          },
        });
      } catch (err) {
        console.warn('[MantenimientoGraphQLRepository] Error al encolar en SyncEngine:', err);
      }
    }

    return {
      id: localId,
      tipo: params.tipo as TipoMantenimiento,
      fechaInicio: params.fechaInicio,
      descripcion: params.descripcion,
      costo: Number(params.costoEstimado || 0),
      estado: EstadoMantenimiento.PROGRAMADO,
      proximoMantenimiento: params.proximoMantenimiento,
      observacion: params.observacion,
      equipoId: params.equipoId,
    };
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

