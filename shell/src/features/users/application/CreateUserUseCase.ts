import type { UsersRepository } from '../domain/UsersRepository';
import type { ManagedUser, CreateUserParams } from '../domain/ManagedUser';

export class CreateUserUseCase {
  private readonly usersRepository: UsersRepository;

  constructor(usersRepository: UsersRepository) {
    this.usersRepository = usersRepository;
  }

  async execute(params: CreateUserParams): Promise<ManagedUser> {
    return this.usersRepository.createUser(params);
  }
}
