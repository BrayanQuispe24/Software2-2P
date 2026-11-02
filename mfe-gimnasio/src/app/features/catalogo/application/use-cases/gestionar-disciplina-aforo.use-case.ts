import {
  ICatalogoRepository,
  ActualizarDisciplinaInput,
  CrearHorarioInput,
  ActualizarHorarioInput,
  AsignarDisciplinaHorarioInput,
} from '../../domain/repositories/catalogo.repository';
import { Disciplina, DisciplinaHorario, Horario } from '../../domain/models/disciplina.model';

export class ActualizarDisciplinaUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(id: string, input: ActualizarDisciplinaInput): Promise<Disciplina> {
    return this.repository.actualizarDisciplina(id, input);
  }
}

export class EliminarDisciplinaUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(id: string): Promise<boolean> {
    return this.repository.eliminarDisciplina(id);
  }
}

export class ActualizarAforoDisciplinaUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(id: string, capacidadMaxima: number): Promise<Disciplina> {
    return this.repository.actualizarAforoDisciplina(id, capacidadMaxima);
  }
}

export class ActualizarCupoHorarioUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(disciplinaHorarioId: string, cupoDisponible: number): Promise<DisciplinaHorario> {
    return this.repository.actualizarCupoHorario(disciplinaHorarioId, cupoDisponible);
  }
}

export class CrearHorarioUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(input: CrearHorarioInput): Promise<Horario> {
    return this.repository.crearHorario(input);
  }
}

export class ActualizarHorarioUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(id: string, input: ActualizarHorarioInput): Promise<Horario> {
    return this.repository.actualizarHorario(id, input);
  }
}

export class AsignarDisciplinaHorarioUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(input: AsignarDisciplinaHorarioInput): Promise<DisciplinaHorario> {
    return this.repository.asignarDisciplinaHorario(input);
  }
}

export class EliminarDisciplinaHorarioUseCase {
  constructor(private readonly repository: ICatalogoRepository) {}

  execute(disciplinaHorarioId: string): Promise<boolean> {
    return this.repository.eliminarDisciplinaHorario(disciplinaHorarioId);
  }
}
