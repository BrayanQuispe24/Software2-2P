import type { AuthRepository } from '../domain/AuthRepository';

export class StartLoginUseCase {
  private readonly authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  execute(): void {
    this.authRepository.startLogin();
  }
}
