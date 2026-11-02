import type { UsersRepository, UpdateUserParams } from '../domain/UsersRepository';
import type { ManagedUser } from '../domain/ManagedUser';

export class UpdateUserUseCase {
  private readonly usersRepository: UsersRepository;

  constructor(usersRepository: UsersRepository) {
    this.usersRepository = usersRepository;
  }

  async execute(id: string, params: UpdateUserParams): Promise<ManagedUser> {
    return this.usersRepository.updateUser(id, params);
  }
}
