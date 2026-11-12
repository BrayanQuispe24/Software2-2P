import { Injectable } from '@angular/core';
import { EquipoRepositoryPort } from '../domain/ports/equipo-repository.port';
import { Equipo, CrearEquipoParams, AmbienteRef, MarcaRef, TipoEquipoRef } from '../domain/models/equipo.model';
import { EstadoEquipo } from '../domain/enums/estado-equipo.enum';
import { GraphQLClientService, isOfflineOrNetworkError } from '../../../core/graphql/graphql.client';
import {
  EQUIPOS_QUERY,
  CREAR_EQUIPO_MUTATION,
  ACTUALIZAR_ESTADO_EQUIPO_MUTATION,
  CATALOGOS_QUERY,
  CREAR_AMBIENTE_MUTATION,
  CREAR_MARCA_MUTATION,
} from './equipo-queries.graphql';
import { EquipoMapper } from './equipo.mapper';

const CACHE_EQUIPOS_KEY = 'apex_cached_equipos_list';

function getGlobalSyncEngine(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).__APEX_SYNC_ENGINE__ || (window.parent as any)?.__APEX_SYNC_ENGINE__ || null;
}

@Injectable({
  providedIn: 'root',
})
export class EquipoGraphQLRepository implements EquipoRepositoryPort {
  constructor(private readonly client: GraphQLClientService) {}

  private getLocalCache(): Equipo[] {
    try {
      const raw = localStorage.getItem(CACHE_EQUIPOS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalCache(equipos: Equipo[]): void {
    try {
      localStorage.setItem(CACHE_EQUIPOS_KEY, JSON.stringify(equipos));
    } catch (e) {
      console.warn('[EquipoGraphQLRepository] Error al guardar caché de equipos:', e);
    }
  }

  async listar(estado?: EstadoEquipo, ambienteId?: string, marcaId?: string): Promise<Equipo[]> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.filterLocalList(this.getLocalCache(), estado, ambienteId, marcaId);
    }

    try {
      const data = await this.client.query<any>(EQUIPOS_QUERY, { estado, ambienteId, marcaId });
      const list = data?.equipos?.data || data?.equipos || [];
      const domainList = list.map((item: any) => EquipoMapper.toDomain(item));
      this.saveLocalCache(domainList);
      return domainList;
    } catch (error) {
      if (isOfflineOrNetworkError(error)) {
        return this.filterLocalList(this.getLocalCache(), estado, ambienteId, marcaId);
      }
      throw error;
    }
  }

  private filterLocalList(
    list: Equipo[],
    estado?: EstadoEquipo,
    ambienteId?: string,
    marcaId?: string
  ): Equipo[] {
    let result = list;
    if (estado) {
      result = result.filter((e) => e.estado === estado);
    }
    if (ambienteId) {
      result = result.filter((e) => e.ambiente?.id === ambienteId);
    }
    if (marcaId) {
      result = result.filter((e) => e.marca?.id === marcaId);
    }
    return result;
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
    try {
      const data = await this.client.query<any>(query, { id });
      return data?.equipoPorId ? EquipoMapper.toDomain(data.equipoPorId) : null;
    } catch (error) {
      if (isOfflineOrNetworkError(error)) {
        const found = this.getLocalCache().find((e) => e.id === id);
        return found || null;
      }
      throw error;
    }
  }

  async crear(params: CrearEquipoParams): Promise<Equipo> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.enqueueCrearOffline(params);
    }

    try {
      const data = await this.client.query<any>(CREAR_EQUIPO_MUTATION, { input: params });
      const created = EquipoMapper.toDomain(data.crearEquipo);
      const current = this.getLocalCache();
      this.saveLocalCache([created, ...current.filter((e) => e.id !== created.id)]);
      return created;
    } catch (error) {
      if (isOfflineOrNetworkError(error)) {
        return this.enqueueCrearOffline(params);
      }
      throw error;
    }
  }

  private async enqueueCrearOffline(params: CrearEquipoParams): Promise<Equipo> {
    const localId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local_${Date.now()}`;
    const syncEngine = getGlobalSyncEngine();

    const optimistic: Equipo = {
      id: localId,
      codigo: params.codigo || `EQ-OFF-${localId.substring(0, 6).toUpperCase()}`,
      nombre: params.nombre,
      modelo: params.modelo,
      fechaAdquisicion: params.fechaAdquisicion || new Date().toISOString().split('T')[0],
      precioCompra: params.precioCompra,
      estado: EstadoEquipo.OPERATIVO,
      cantidad: params.cantidadInicial || 1,
      ambiente: { id: params.ambienteId, nombre: 'Ambiente Asignado' },
      marca: { id: params.marcaId, nombre: 'Marca Asignada' },
      tipoEquipo: { id: params.tipoEquipoId, nombre: 'Tipo Asignado' },
    };

    if (syncEngine && typeof syncEngine.enqueueMutation === 'function') {
      try {
        await syncEngine.enqueueMutation({
          entityType: 'EQUIPO',
          operationType: 'CREATE',
          endpoint: '/graphql/inventario',
          httpMethod: 'POST',
          payload: {
            query: CREAR_EQUIPO_MUTATION,
            variables: { input: params },
          },
        });
      } catch (err) {
        console.warn('[EquipoGraphQLRepository] Error al encolar mutación en SyncEngine:', err);
      }
    }

    const current = this.getLocalCache();
    this.saveLocalCache([optimistic, ...current.filter((e) => e.id !== localId)]);
    return optimistic;
  }

  async actualizarEstado(id: string, nuevoEstado: EstadoEquipo): Promise<Equipo> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.enqueueActualizarEstadoOffline(id, nuevoEstado);
    }

    try {
      const data = await this.client.query<any>(ACTUALIZAR_ESTADO_EQUIPO_MUTATION, { id, nuevoEstado });
      const current = this.getLocalCache();
      this.saveLocalCache(current.map((e) => (e.id === id ? { ...e, estado: nuevoEstado } : e)));
      return data.actualizarEstadoEquipo;
    } catch (error) {
      if (isOfflineOrNetworkError(error)) {
        return this.enqueueActualizarEstadoOffline(id, nuevoEstado);
      }
      throw error;
    }
  }

  private async enqueueActualizarEstadoOffline(id: string, nuevoEstado: EstadoEquipo): Promise<Equipo> {
    const syncEngine = getGlobalSyncEngine();
    if (syncEngine && typeof syncEngine.enqueueMutation === 'function') {
      try {
        await syncEngine.enqueueMutation({
          entityType: 'EQUIPO',
          operationType: 'UPDATE',
          endpoint: '/graphql/inventario',
          httpMethod: 'POST',
          payload: {
            query: ACTUALIZAR_ESTADO_EQUIPO_MUTATION,
            variables: { id, nuevoEstado },
          },
        });
      } catch (err) {
        console.warn('[EquipoGraphQLRepository] Error al encolar actualización:', err);
      }
    }

    const current = this.getLocalCache();
    const existing = current.find((e) => e.id === id);
    const updated: Equipo = existing
      ? { ...existing, estado: nuevoEstado }
      : {
          id,
          codigo: 'EQ-LOCAL',
          nombre: 'Equipo',
          estado: nuevoEstado,
          cantidad: 1,
          ambiente: { id: '', nombre: '' },
          marca: { id: '', nombre: '' },
          tipoEquipo: { id: '', nombre: '' },
        };

    this.saveLocalCache(current.map((e) => (e.id === id ? updated : e)));
    return updated;
  }

  async listarAmbientes(): Promise<AmbienteRef[]> {
    try {
      const data = await this.client.query<any>(CATALOGOS_QUERY);
      return data?.ambientes || [];
    } catch {
      return [
        { id: 'amb-1', nombre: 'Sala de Musculación Principal' },
        { id: 'amb-2', nombre: 'Zona Cardio' },
        { id: 'amb-3', nombre: 'Salón de Spinning' },
      ];
    }
  }

  async crearAmbiente(nombre: string, descripcion?: string): Promise<AmbienteRef> {
    const data = await this.client.query<any>(CREAR_AMBIENTE_MUTATION, { nombre, descripcion });
    return data?.crearAmbiente;
  }

  async listarMarcas(): Promise<MarcaRef[]> {
    try {
      const data = await this.client.query<any>(CATALOGOS_QUERY);
      return data?.marcas || [];
    } catch {
      return [
        { id: 'marca-1', nombre: 'Life Fitness' },
        { id: 'marca-2', nombre: 'Technogym' },
        { id: 'marca-3', nombre: 'Matrix Fitness' },
      ];
    }
  }

  async crearMarca(nombre: string): Promise<MarcaRef> {
    const data = await this.client.query<any>(CREAR_MARCA_MUTATION, { nombre });
    return data?.crearMarca;
  }

  async listarTiposEquipo(): Promise<TipoEquipoRef[]> {
    try {
      const data = await this.client.query<any>(CATALOGOS_QUERY);
      return data?.tiposEquipo || [];
    } catch {
      return [
        { id: 'tipo-1', nombre: 'Caminadora Eléctrica Pro' },
        { id: 'tipo-2', nombre: 'Prensa de Piernas 45°' },
        { id: 'tipo-3', nombre: 'Bicicleta Spinning Estática' },
      ];
    }
  }
}

