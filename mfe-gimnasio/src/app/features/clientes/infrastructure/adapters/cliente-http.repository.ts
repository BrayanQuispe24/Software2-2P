import { Injectable } from '@angular/core';
import { Cliente } from '../../domain/models/cliente.model';
import { ClienteRepository } from '../../domain/repositories/cliente.repository';

const CACHE_STORAGE_KEY = 'apex_gimnasio_clientes_cache';

/**
 * Catálogo Semilla de Contingencia (Fallback para cuando ms-auth está fuera de línea).
 */
const FALLBACK_CLIENTES_SEMILLA: Cliente[] = [
  {
    id: 'd9d0b968-b7d4-4b15-9ab6-7ae3637fcb5f',
    codigo: 'CLI-6305913',
    nombre: 'Brayan',
    apellido: 'Quispe',
    ci: '6305913',
    celular: '78494110',
    email: 'brayansabinoquispearce2021@gmail.com',
    tipoUsuario: 'CLIENTE',
    estado: 'ACTIVO',
  },
  {
    id: 'c2000000-0000-0000-0000-000000000001',
    codigo: 'CLI-4892019',
    nombre: 'Carlos',
    apellido: 'Mendoza Rivera',
    ci: '4892019',
    celular: '77239102',
    email: 'carlos.mendoza@apexfitness.bo',
    tipoUsuario: 'CLIENTE',
    estado: 'ACTIVO',
  },
  {
    id: 'c2000000-0000-0000-0000-000000000002',
    codigo: 'CLI-5938210',
    nombre: 'Valeria',
    apellido: 'Torrico Camacho',
    ci: '5938210',
    celular: '70192834',
    email: 'valeria.torrico@apexfitness.bo',
    tipoUsuario: 'CLIENTE',
    estado: 'ACTIVO',
  },
  {
    id: 'c2000000-0000-0000-0000-000000000003',
    codigo: 'CLI-7129481',
    nombre: 'Alejandro',
    apellido: 'Justiniano Vaca',
    ci: '7129481',
    celular: '68291039',
    email: 'ale.justiniano@apexfitness.bo',
    tipoUsuario: 'CLIENTE',
    estado: 'ACTIVO',
  },
  {
    id: 'fd6b10f4-fc5e-4b6c-b906-c11a9f3095a0',
    codigo: 'ADM-001',
    nombre: 'Administrador',
    apellido: 'Sistema',
    ci: '12345678',
    celular: '70000000',
    email: 'admin@test.com',
    tipoUsuario: 'ADMIN',
    estado: 'ACTIVO',
  },
];

@Injectable({
  providedIn: 'root',
})
export class ClienteHttpRepository implements ClienteRepository {
  private get isLocal(): boolean {
    return typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  }

  private get gatewayUsersUrl(): string {
    return this.isLocal ? 'http://localhost:3000/api/users' : '/api/users';
  }

  private get authUsersUrl(): string {
    return this.isLocal ? 'http://localhost:4000/users' : '/api/users';
  }

  async listarClientesActivos(): Promise<Cliente[]> {
    let clientesRemotos: Cliente[] | null = null;

    // 1. Intento primario: ms-auth directo (puerto 4000)
    try {
      clientesRemotos = await this.fetchWithTimeout(this.authUsersUrl, 2500);
    } catch {
      // 2. Intento secundario: a través de API Gateway (puerto 3000)
      try {
        clientesRemotos = await this.fetchWithTimeout(this.gatewayUsersUrl, 2500);
      } catch {
        clientesRemotos = null;
      }
    }

    if (clientesRemotos && clientesRemotos.length > 0) {
      // Mapear y filtrar activos
      const clientesNormalizados: Cliente[] = clientesRemotos.map((u: any) => ({
        id: u.id,
        codigo: u.codigo || `SOC-${u.ci || '000'}`,
        nombre: u.nombre || '',
        apellido: u.apellido || '',
        ci: u.ci || '',
        celular: u.celular,
        email: u.email || '',
        tipoUsuario: u.tipoUsuario || 'CLIENTE',
        estado: (u.estado === 'ACTIVO' || !u.estado) ? ('ACTIVO' as const) : ('INACTIVO' as const),
      })).filter((c) => c.estado === 'ACTIVO');

      // Persistir en caché local
      this.guardarEnCache(clientesNormalizados);
      return clientesNormalizados;
    }

    // 3. Fallback: Recuperar de caché local
    const clientesCache = this.recuperarDeCache();
    if (clientesCache && clientesCache.length > 0) {
      console.warn('[ClienteHttpRepository] ms-auth no disponible. Usando caché local de socios.');
      return clientesCache;
    }

    // 4. Último recurso: Catálogo semilla precargado
    console.warn('[ClienteHttpRepository] Usando catálogo semilla de contingencia para socios.');
    this.guardarEnCache(FALLBACK_CLIENTES_SEMILLA);
    return FALLBACK_CLIENTES_SEMILLA;
  }

  async obtenerClientePorId(id: string): Promise<Cliente | null> {
    const todos = await this.listarClientesActivos();
    return todos.find((c) => c.id === id) || null;
  }

  private async fetchWithTimeout(url: string, timeoutMs: number): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  private guardarEnCache(clientes: Cliente[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(clientes));
      }
    } catch {
      // Ignorar errores de cuota de storage
    }
  }

  private recuperarDeCache(): Cliente[] | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(CACHE_STORAGE_KEY);
        if (data) {
          return JSON.parse(data);
        }
      }
    } catch {
      return null;
    }
    return null;
  }
}
