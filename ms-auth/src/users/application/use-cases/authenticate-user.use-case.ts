import { UserRepositoryPort } from '../ports/out/user-repository.port.js';
import { PasswordHasherPort } from '../ports/out/password-hasher.port.js';
import { UserResult, toUserResult } from '../models/user.result.js';

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(identifier: string, plainPassword: string): Promise<UserResult | null> {
    const user = await this.userRepository.findForAuth(identifier);
    if (!user || !user.isActive()) {
      return null;
    }

    const isMatch = await this.passwordHasher.compare(plainPassword, user.getPasswordHash());
    if (!isMatch) {
      return null;
    }

    return toUserResult(user);
  }
}
