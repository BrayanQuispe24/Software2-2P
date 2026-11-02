import { ICatalogoRepository } from '../../domain/repositories/catalogo.repository';
import { Disciplina } from '../../domain/models/disciplina.model';

export class ListarDisciplinasUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(soloActivas: boolean = true): Promise<Disciplina[]> {
    return this.repository.listarDisciplinas(soloActivas);
  }
}
