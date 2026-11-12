import { Injectable } from '@angular/core';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>;
}

export function isOfflineOrNetworkError(error?: any): boolean {
  return (
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    error?.name === 'TypeError' ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('NetworkError') ||
    error?.message?.includes('Network Error')
  );
}

@Injectable({
  providedIn: 'root',
})
export class GraphQLClientService {
  private readonly endpoint = typeof location !== 'undefined' && location.port === '9104'
    ? 'http://localhost:8084/graphql'
    : '/graphql/inventario';

  private getOperationKey(query: string, variables: Record<string, any>): string {
    const cleanName = query.trim().split(/[\s({]/)[1] || 'anonymous';
    return `apex_gql_cache_${cleanName}_${JSON.stringify(variables)}`;
  }

  async query<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const isMutation = query.trim().startsWith('mutation');
    const cacheKey = this.getOperationKey(query, variables);

    // Si estamos sin conexión y es una consulta (query de lectura), buscar directamente en caché local
    if (!isMutation && typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          return JSON.parse(cached) as T;
        }
      } catch (e) {
        console.warn('[GraphQLClientService] Error al leer caché local:', e);
      }
    }

    try {
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
        throw new Error(`Error HTTP al comunicar con GraphQL: ${response.status} ${response.statusText}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors.map((e) => e.message).join(' | '));
      }

      if (!result.data) {
        throw new Error('Respuesta vacía de GraphQL.');
      }

      // Si es lectura exitosa, refrescar la caché local
      if (!isMutation) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result.data));
        } catch {}
      }

      return result.data;
    } catch (error: any) {
      // Si falló por red y es consulta de lectura, intentar fallback a la última versión en caché
      if (!isMutation && isOfflineOrNetworkError(error)) {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            console.info('[GraphQLClientService] Sirviendo respuesta desde caché offline para:', query.trim().split(/[\s({]/)[1]);
            return JSON.parse(cached) as T;
          }
        } catch {}
      }

      throw error;
    }
  }
}

