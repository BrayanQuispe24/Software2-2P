import { UserRepositoryPort } from '../ports/out/user-repository.port.js';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error.js';
import { UpdateUserCommand } from '../models/update-user.command.js';
import { UserResult, toUserResult } from '../models/user.result.js';

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: UpdateUserCommand): Promise<UserResult> {
    const user = await this.userRepository.findById(command.id);
    if (!user) {
      throw new UserNotFoundError(command.id);
    }

    user.updateProfile({
      nombre: command.nombre,
      apellido: command.apellido,
      celular: command.celular,
      tipoUsuario: command.tipoUsuario,
    });

    await this.userRepository.update(user);

    return toUserResult(user);
  }
}
