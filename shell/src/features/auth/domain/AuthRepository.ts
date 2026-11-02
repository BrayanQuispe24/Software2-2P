import type { AuthSession } from './AuthUser';

export interface AuthRepository {
  getSession(): Promise<AuthSession | null>;
  startLogin(): void;
  logout(): Promise<void>;
}
