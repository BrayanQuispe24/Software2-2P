import type { ManagedUser, CreateUserParams } from './ManagedUser';

export interface UpdateUserParams {
  nombre?: string;
  apellido?: string;
  celular?: string;
  tipoUsuario?: string;
}

export interface UsersRepository {
  getUsers(): Promise<ManagedUser[]>;
  createUser(params: CreateUserParams): Promise<ManagedUser>;
  updateUser(id: string, params: UpdateUserParams): Promise<ManagedUser>;
  deactivateUser(id: string): Promise<void>;
}
