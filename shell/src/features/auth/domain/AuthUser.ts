import type { Role } from './Role';

export interface AuthUser {
  sub: string;
  email?: string;
  name?: string;
  codigo?: string;
  tipoUsuario?: string;
  roles: Role[];
  permissions: string[];
}

export interface AuthSession {
  authenticated: boolean;
  user: AuthUser;
  expiresAt?: number;
}
