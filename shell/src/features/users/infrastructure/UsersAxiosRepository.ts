import type { AxiosInstance } from 'axios';
import type { UsersRepository, UpdateUserParams } from '../domain/UsersRepository';
import type { ManagedUser, CreateUserParams } from '../domain/ManagedUser';
import { getSyncEngine } from '../../../shared/sync-core';

const CACHE_KEY = 'apex_cached_users';

function isNetworkError(error: any): boolean {
  return (
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    error?.code === 'ERR_NETWORK' ||
    error?.message?.includes('Network Error') ||
    !error?.response
  );
}

export class UsersAxiosRepository implements UsersRepository {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
  }

  private getLocalCache(): ManagedUser[] {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalCache(users: ManagedUser[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('[UsersAxiosRepository] Error al guardar caché local de usuarios:', e);
    }
  }

  async getUsers(): Promise<ManagedUser[]> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.getLocalCache();
    }

    try {
      const response = await this.httpClient.get<ManagedUser[]>('/api/users');
      const users = response.data || [];
      this.saveLocalCache(users);
      return users;
    } catch (error) {
      if (isNetworkError(error)) {
        return this.getLocalCache();
      }
      throw error;
    }
  }

  async createUser(params: CreateUserParams): Promise<ManagedUser> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.enqueueCreateOffline(params);
    }

    try {
      const response = await this.httpClient.post<ManagedUser>('/api/users', params);
      const createdUser = response.data;
      const current = this.getLocalCache();
      this.saveLocalCache([createdUser, ...current.filter((u) => u.id !== createdUser.id)]);
      return createdUser;
    } catch (error) {
      if (isNetworkError(error)) {
        return this.enqueueCreateOffline(params);
      }
      throw error;
    }
  }

  private async enqueueCreateOffline(params: CreateUserParams): Promise<ManagedUser> {
    const engine = getSyncEngine();
    const { localId } = await engine.enqueueMutation({
      entityType: 'USER',
      operationType: 'CREATE',
      endpoint: '/api/users',
      httpMethod: 'POST',
      payload: params as unknown as Record<string, any>,
    });

    const optimisticUser: ManagedUser = {
      id: localId,
      codigo: params.codigo || `OFF-${localId.substring(0, 8).toUpperCase()}`,
      nombre: params.nombre,
      apellido: params.apellido,
      ci: params.ci,
      celular: params.celular,
      email: params.email,
      tipoUsuario: params.role,
      estado: 'ACTIVO',
      fechaRegistro: new Date().toISOString(),
    };

    const current = this.getLocalCache();
    this.saveLocalCache([optimisticUser, ...current.filter((u) => u.id !== localId)]);

    return optimisticUser;
  }

  async updateUser(id: string, params: UpdateUserParams): Promise<ManagedUser> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.enqueueUpdateOffline(id, params);
    }

    try {
      const response = await this.httpClient.patch<ManagedUser>(`/api/users/${id}`, params);
      const updatedUser = response.data;
      const current = this.getLocalCache();
      this.saveLocalCache(current.map((u) => (u.id === id ? updatedUser : u)));
      return updatedUser;
    } catch (error) {
      if (isNetworkError(error)) {
        return this.enqueueUpdateOffline(id, params);
      }
      throw error;
    }
  }

  private async enqueueUpdateOffline(id: string, params: UpdateUserParams): Promise<ManagedUser> {
    const engine = getSyncEngine();
    await engine.enqueueMutation({
      entityType: 'USER',
      operationType: 'UPDATE',
      endpoint: `/api/users/${id}`,
      httpMethod: 'PATCH',
      payload: params as unknown as Record<string, any>,
    });

    const current = this.getLocalCache();
    const existing = current.find((u) => u.id === id);
    const updatedUser: ManagedUser = existing
      ? {
          ...existing,
          ...params,
          tipoUsuario: params.tipoUsuario || existing.tipoUsuario,
        }
      : {
          id,
          codigo: 'OFF-UPDATE',
          nombre: params.nombre || '',
          apellido: params.apellido || '',
          ci: '',
          celular: params.celular || '',
          email: '',
          tipoUsuario: params.tipoUsuario || 'CLIENTE',
          estado: 'ACTIVO',
          fechaRegistro: new Date().toISOString(),
        };

    this.saveLocalCache(current.map((u) => (u.id === id ? updatedUser : u)));
    return updatedUser;
  }

  async deactivateUser(id: string): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.enqueueDeactivateOffline(id);
    }

    try {
      await this.httpClient.delete(`/api/users/${id}`);
      const current = this.getLocalCache();
      this.saveLocalCache(current.map((u) => (u.id === id ? { ...u, estado: 'INACTIVO' } : u)));
    } catch (error) {
      if (isNetworkError(error)) {
        return this.enqueueDeactivateOffline(id);
      }
      throw error;
    }
  }

  private async enqueueDeactivateOffline(id: string): Promise<void> {
    const engine = getSyncEngine();
    await engine.enqueueMutation({
      entityType: 'USER',
      operationType: 'DELETE',
      endpoint: `/api/users/${id}`,
      httpMethod: 'DELETE',
      payload: { id },
    });

    const current = this.getLocalCache();
    this.saveLocalCache(current.map((u) => (u.id === id ? { ...u, estado: 'INACTIVO' } : u)));
  }
}

