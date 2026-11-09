import type { AxiosInstance } from 'axios';
import type { AuthRepository } from '../domain/AuthRepository';
import type { AuthSession, AuthUser } from '../domain/AuthUser';
import type { Role } from '../domain/Role';
import type { AuthSessionDto } from './authDto';

export class AuthAxiosRepository implements AuthRepository {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const response = await this.httpClient.get<AuthSessionDto>('/auth/me');
      if (!response.data || !response.data.authenticated) {
        return null;
      }

      const userDto = response.data.user;
      const validRoles: Role[] = (userDto.roles || []).filter(
        (role): role is Role =>
          ['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUCTOR', 'CLIENTE'].includes(role)
      );

      const user: AuthUser = {
        sub: userDto.sub,
        email: userDto.email,
        name: userDto.name,
        codigo: userDto.codigo,
        tipoUsuario: userDto.tipoUsuario,
        roles: validRoles,
        permissions: userDto.permissions || [],
      };

      return {
        authenticated: true,
        user,
        expiresAt: response.data.expiresAt,
      };
    } catch (error: any) {
      if (error?.response?.status === 401) {
        return null;
      }
      console.warn('Sesión no encontrada o error al consultar /auth/me:', error?.message);
      return null;
    }
  }

  startLogin(): void {
    window.location.assign('/auth/login');
  }

  async logout(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
      const response = await this.httpClient.post<{ message: string; logoutUrl?: string }>('/auth/logout');
      if (response.data?.logoutUrl) {
        window.location.assign(response.data.logoutUrl);
        return;
      }
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
    window.location.assign('/login');
  }
}
