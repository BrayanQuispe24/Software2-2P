import type { AxiosInstance } from 'axios';
import type { UsersRepository, UpdateUserParams } from '../domain/UsersRepository';
import type { ManagedUser, CreateUserParams } from '../domain/ManagedUser';

export class UsersAxiosRepository implements UsersRepository {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
  }

  async getUsers(): Promise<ManagedUser[]> {
    const response = await this.httpClient.get<ManagedUser[]>('/api/users');
    return response.data || [];
  }

  async createUser(params: CreateUserParams): Promise<ManagedUser> {
    const response = await this.httpClient.post<ManagedUser>('/api/users', params);
    return response.data;
  }

  async updateUser(id: string, params: UpdateUserParams): Promise<ManagedUser> {
    const response = await this.httpClient.patch<ManagedUser>(`/api/users/${id}`, params);
    return response.data;
  }

  async deactivateUser(id: string): Promise<void> {
    await this.httpClient.delete(`/api/users/${id}`);
  }
}
