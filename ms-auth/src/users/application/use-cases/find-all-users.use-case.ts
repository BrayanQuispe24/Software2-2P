import { UserRepositoryPort } from '../ports/out/user-repository.port.js';
import { UserResult, toUserResult } from '../models/user.result.js';

export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(): Promise<UserResult[]> {
    const users = await this.userRepository.findAll();
    return users.map(toUserResult);
  }
}
