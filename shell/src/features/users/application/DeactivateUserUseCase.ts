import type { UsersRepository } from '../domain/UsersRepository';

export class DeactivateUserUseCase {
  private readonly usersRepository: UsersRepository;

  constructor(usersRepository: UsersRepository) {
    this.usersRepository = usersRepository;
  }

  async execute(id: string): Promise<void> {
    return this.usersRepository.deactivateUser(id);
  }
}
