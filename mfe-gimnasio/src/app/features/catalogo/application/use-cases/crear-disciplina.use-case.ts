import { ICatalogoRepository, CrearDisciplinaInput } from '../../domain/repositories/catalogo.repository';
import { Disciplina } from '../../domain/models/disciplina.model';

export class CrearDisciplinaUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(input: CrearDisciplinaInput): Promise<Disciplina> {
    if (!input.codigo || !input.nombre || input.capacidadMaxima <= 0) {
      throw new Error('Código, nombre y capacidad máxima válida son obligatorios.');
    }
    return this.repository.crearDisciplina(input);
  }
}
