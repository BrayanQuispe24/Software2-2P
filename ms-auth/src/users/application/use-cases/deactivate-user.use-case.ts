import { UserRepositoryPort } from '../ports/out/user-repository.port.js';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error.js';
import { UserResult, toUserResult } from '../models/user.result.js';

export class DeactivateUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(id: string): Promise<UserResult> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    user.deactivate();
    await this.userRepository.update(user);

    return toUserResult(user);
  }
}
