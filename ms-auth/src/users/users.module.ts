import { Module } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from './application/ports/out/user-repository.port.js';
import { PASSWORD_HASHER, PasswordHasherPort } from './application/ports/out/password-hasher.port.js';
import { PrismaUserRepository } from './infrastructure/adapters/out/persistence/prisma/prisma-user.repository.js';
import { Argon2PasswordHasherAdapter } from './infrastructure/adapters/out/security/argon2-password-hasher.adapter.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { FindAllUsersUseCase } from './application/use-cases/find-all-users.use-case.js';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case.js';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case.js';
import { DeactivateUserUseCase } from './application/use-cases/deactivate-user.use-case.js';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case.js';
import { UsersService } from './users.service.js';
import { UsersController } from './infrastructure/adapters/in/http/users.controller.js';

@Module({
  controllers: [UsersController],
  providers: [
    // Adaptadores
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasherAdapter,
    },
    // Casos de uso instanciados mediante factories
    {
      provide: CreateUserUseCase,
      useFactory: (repo: UserRepositoryPort, hasher: PasswordHasherPort) =>
        new CreateUserUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: FindAllUsersUseCase,
      useFactory: (repo: UserRepositoryPort) => new FindAllUsersUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: FindUserByIdUseCase,
      useFactory: (repo: UserRepositoryPort) => new FindUserByIdUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (repo: UserRepositoryPort) => new UpdateUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: DeactivateUserUseCase,
      useFactory: (repo: UserRepositoryPort) => new DeactivateUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: AuthenticateUserUseCase,
      useFactory: (repo: UserRepositoryPort, hasher: PasswordHasherPort) =>
        new AuthenticateUserUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    // Fachada de servicio
    UsersService,
  ],
  exports: [
    UsersService,
    USER_REPOSITORY,
    PASSWORD_HASHER,
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    DeactivateUserUseCase,
    AuthenticateUserUseCase,
  ],
})
export class UsersModule {}
