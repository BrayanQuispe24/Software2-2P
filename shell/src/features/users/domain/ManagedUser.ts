import type { Role } from '../../auth/domain/Role';

export interface ManagedUser {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string;
  ci: string;
  celular: string;
  email: string;
  tipoUsuario: string;
  estado: string;
  fechaRegistro: string;
}

export interface CreateUserParams {
  codigo?: string;
  nombre: string;
  apellido: string;
  ci: string;
  celular: string;
  email: string;
  password: string;
  role: Role;
}
