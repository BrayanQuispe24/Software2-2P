import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { FindAllUsersUseCase } from './application/use-cases/find-all-users.use-case.js';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case.js';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case.js';
import { DeactivateUserUseCase } from './application/use-cases/deactivate-user.use-case.js';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case.js';
import type { PasswordHasherPort } from './application/ports/out/password-hasher.port.js';
import { PASSWORD_HASHER } from './application/ports/out/password-hasher.port.js';
import { CreateUserDto } from './infrastructure/adapters/in/http/dto/create-user.dto.js';
import { UpdateUserDto } from './infrastructure/adapters/in/http/dto/update-user.dto.js';
import { UserAlreadyExistsError } from './domain/errors/user-already-exists.error.js';
import { UserNotFoundError } from './domain/errors/user-not-found.error.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async create(dto: CreateUserDto) {
    try {
      return await this.createUserUseCase.execute(dto);
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  async registerClient(dto: {
    nombre: string;
    apellido: string;
    ci: string;
    celular: string;
    email: string;
    password: string;
    aceptaTerminos?: boolean;
  }) {
    try {
      return await this.createUserUseCase.execute({
        ...dto,
        tipoUsuario: 'CLIENTE',
        role: 'CLIENTE',
        aceptaTerminos: dto.aceptaTerminos ?? true,
      });
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  async findAll() {
    return this.findAllUsersUseCase.execute();
  }

  async findOne(id: string) {
    try {
      return await this.findUserByIdUseCase.execute(id);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      return await this.updateUserUseCase.execute({ id, ...dto });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof UserAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  async deactivate(id: string) {
    try {
      return await this.deactivateUserUseCase.execute(id);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  async findForAuthentication(identifier: string) {
    // Búsqueda por credencial para el futuro flujo OIDC
    return this.authenticateUserUseCase.execute(identifier, '');
  }

  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    return this.passwordHasher.compare(plain, hash);
  }
}
