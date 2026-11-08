import { User } from '../../../domain/entities/user.entity.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  save(user: User, roleName?: string): Promise<void>;
  update(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByCodigo(codigo: string): Promise<User | null>;
  findByCi(ci: string): Promise<User | null>;
  findForAuth(identifier: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}
