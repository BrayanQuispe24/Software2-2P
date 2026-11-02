import type { UsersRepository } from '../domain/UsersRepository';
import type { ManagedUser } from '../domain/ManagedUser';

export class GetUsersUseCase {
  private readonly usersRepository: UsersRepository;

  constructor(usersRepository: UsersRepository) {
    this.usersRepository = usersRepository;
  }

  async execute(): Promise<ManagedUser[]> {
    return this.usersRepository.getUsers();
  }
}
