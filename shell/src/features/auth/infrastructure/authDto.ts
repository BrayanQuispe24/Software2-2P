export interface AuthUserDto {
  sub: string;
  email?: string;
  name?: string;
  codigo?: string;
  tipoUsuario?: string;
  roles?: string[];
  permissions?: string[];
}

export interface AuthSessionDto {
  authenticated: boolean;
  user: AuthUserDto;
  expiresAt?: number;
}
