import { Cliente } from '../models/cliente.model';

/**
 * Puerto de Salida (Output Port): Repositorio de Clientes
 * Define las operaciones abstractas para obtener información de socios/clientes.
 */
export interface ClienteRepository {
  listarClientesActivos(): Promise<Cliente[]>;
  obtenerClientePorId(id: string): Promise<Cliente | null>;
}
