import type { AuthUser } from '../../features/auth/domain/AuthUser';
import type { Role } from '../../features/auth/domain/Role';
import { axiosClient } from '../infrastructure/http/axiosClient';

class SsoAuthService {
  private currentUser: AuthUser | null = null;
  private isLoaded = false;
  private loadingPromise: Promise<AuthUser | null> | null = null;

  /**
   * Consulta la sesión actual con el Gateway (/auth/me) usando cookies httpOnly.
   */
  async loadSession(): Promise<AuthUser | null> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      try {
        const response = await axiosClient.get<{
          authenticated: boolean;
          user: {
            sub: string;
            email?: string;
            name?: string;
            codigo?: string;
            tipoUsuario?: string;
            roles?: string[];
            permissions?: string[];
          };
          expiresAt?: number;
        }>('/auth/me');

        if (!response.data || !response.data.authenticated) {
          this.currentUser = null;
          this.isLoaded = true;
          return null;
        }

        const rawUser = response.data.user;
        const validRoles: Role[] = (rawUser.roles || []).filter(
          (role): role is Role =>
            ['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUCTOR', 'CLIENTE'].includes(role)
        );

        this.currentUser = {
          sub: rawUser.sub,
          email: rawUser.email,
          name: rawUser.name,
          codigo: rawUser.codigo,
          tipoUsuario: rawUser.tipoUsuario,
          roles: validRoles,
          permissions: rawUser.permissions || [],
        };

        this.isLoaded = true;
        return this.currentUser;
      } catch (error: any) {
        this.currentUser = null;
        this.isLoaded = true;
        if (error?.response?.status === 401) {
          return null;
        }
        console.warn('[SSO Auth] Error al verificar sesión:', error?.message);
        return null;
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isSessionLoaded(): boolean {
    return this.isLoaded;
  }

  login(): void {
    window.location.assign('/auth/login');
  }

  async logout(): Promise<void> {
    try {
      const response = await axiosClient.post<{ logoutUrl?: string }>('/auth/logout');
      this.currentUser = null;
      if (response.data?.logoutUrl) {
        window.location.assign(response.data.logoutUrl);
        return;
      }
    } catch (error) {
      console.error('[SSO Auth] Error al cerrar sesión:', error);
    }
    this.currentUser = null;
    window.location.assign('/login');
  }

  hasRole(role: Role): boolean {
    return this.currentUser?.roles?.includes(role) ?? false;
  }

  hasAnyRole(roles: Role[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }
}

export const ssoAuthService = new SsoAuthService();
