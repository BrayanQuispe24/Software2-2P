import { Cliente } from '../../domain/models/cliente.model';
import { ClienteRepository } from '../../domain/repositories/cliente.repository';

/**
 * Caso de Uso: Listar Clientes y Socios Activos
 * Aplica lógica de negocio para ordenar alfabéticamente y filtrar socios listos para inscripción.
 */
export class ListarClientesUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async execute(): Promise<Cliente[]> {
    const clientes = await this.clienteRepository.listarClientesActivos();

    // Ordenar alfabéticamente por apellido y nombre
    return clientes.sort((a, b) => {
      const nombreA = `${a.apellido || ''} ${a.nombre || ''}`.trim().toLowerCase();
      const nombreB = `${b.apellido || ''} ${b.nombre || ''}`.trim().toLowerCase();
      return nombreA.localeCompare(nombreB);
    });
  }
}
