import type { AuthRepository } from '../domain/AuthRepository';
import type { AuthSession } from '../domain/AuthUser';

export class GetSessionUseCase {
  private readonly authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(): Promise<AuthSession | null> {
    return this.authRepository.getSession();
  }
}
