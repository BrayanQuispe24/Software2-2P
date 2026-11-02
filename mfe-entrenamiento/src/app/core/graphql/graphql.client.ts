import { Injectable } from '@angular/core';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>;
}

@Injectable({
  providedIn: 'root',
})
export class GraphQLClientService {
  private readonly endpoint = 'http://localhost:8083/graphql';

  async query<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP al comunicar con GraphQL: ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors.map((e) => e.message).join(' | '));
    }

    if (!result.data) {
      throw new Error('Respuesta vacía del servicio de entrenamiento.');
    }

    return result.data;
  }
}
