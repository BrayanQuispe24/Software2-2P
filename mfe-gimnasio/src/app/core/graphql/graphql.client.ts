import { Injectable } from '@angular/core';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>;
}

@Injectable({
  providedIn: 'root',
})
export class GraphQLClientService {
  private readonly endpoint = 'http://localhost:8082/graphql';

  async query<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP en GraphQL (${this.endpoint}): ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors.map((e) => e.message).join(' | '));
    }

    if (!result.data) {
      throw new Error('Respuesta vacía recibida del microservicio GraphQL.');
    }

    return result.data;
  }
}
