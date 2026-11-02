# Playbook de Implementación End-to-End en NestJS Hexagonal

Este playbook sirve de guía paso a paso para crear un flujo completo respetando la separación de capas:

---

## Paso 1: Dominio (`domain/`)

### Entidad de Dominio
```typescript
// src/auth/domain/entities/user.entity.ts
export class User {
  constructor(
    private readonly id: string,
    private email: string,
    private passwordHash: string,
    private active: boolean,
  ) {}

  static create(id: string, email: string, passwordHash: string): User {
    if (!email.includes('@')) {
      throw new Error('Formato de correo electrónico inválido');
    }
    return new User(id, email, passwordHash, true);
  }

  getId(): string { return this.id; }
  getEmail(): string { return this.email; }
  getPasswordHash(): string { return this.passwordHash; }
  isActive(): boolean { return this.active; }

  deactivate(): void {
    this.active = false;
  }
}
```

---

## Paso 2: Aplicación (`application/`)

### Puerto de Salida
```typescript
// src/auth/application/ports/out/user-repository.port.ts
import { User } from '../../../domain/entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

### Caso de Uso (TypeScript puro)
```typescript
// src/auth/application/use-cases/register-user.use-case.ts
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../ports/out/user-repository.port';

export interface RegisterUserCommand {
  id: string;
  email: string;
  passwordHash: string;
}

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: RegisterUserCommand): Promise<{ userId: string }> {
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new Error(`El usuario con email ${command.email} ya existe`);
    }

    const user = User.create(command.id, command.email, command.passwordHash);
    await this.userRepository.save(user);

    return { userId: user.getId() };
  }
}
```

---

## Paso 3: Infraestructura - Adaptador de Salida (`infrastructure/adapters/out/`)

### Repositorio y Mapper
```typescript
// src/auth/infrastructure/adapters/out/persistence/in-memory-user.repository.ts
import { UserRepositoryPort } from '../../../../application/ports/out/user-repository.port';
import { User } from '../../../../domain/entities/user.entity';

export class InMemoryUserRepository implements UserRepositoryPort {
  private users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.getEmail() === email) return user;
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.getId(), user);
  }
}
```

---

## Paso 4: Infraestructura - Adaptador de Entrada (`infrastructure/adapters/in/`)

### DTO y Controlador
```typescript
// src/auth/infrastructure/adapters/in/http/dto/register-user.dto.ts
export class RegisterUserDto {
  id!: string;
  email!: string;
  password!: string;
}

// src/auth/infrastructure/adapters/in/http/controllers/register-user.controller.ts
import { Body, Controller, Post, HttpCode, HttpStatus, ConflictException } from '@nestjs/common';
import { RegisterUserUseCase } from '../../../../application/use-cases/register-user.use-case';
import { RegisterUserDto } from '../dto/register-user.dto';

@Controller('auth')
export class RegisterUserController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async handle(@Body() dto: RegisterUserDto) {
    try {
      const result = await this.registerUserUseCase.execute({
        id: dto.id,
        email: dto.email,
        passwordHash: dto.password, // En producción se hashea con un hasher port
      });
      return { success: true, ...result };
    } catch (error: any) {
      if (error.message?.includes('ya existe')) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
```

---

## Paso 5: Composition Root (`auth.module.ts`)

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { RegisterUserController } from './infrastructure/adapters/in/http/controllers/register-user.controller';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { USER_REPOSITORY, UserRepositoryPort } from './application/ports/out/user-repository.port';
import { InMemoryUserRepository } from './infrastructure/adapters/out/persistence/in-memory-user.repository';

@Module({
  controllers: [RegisterUserController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: InMemoryUserRepository,
    },
    {
      provide: RegisterUserUseCase,
      useFactory: (repo: UserRepositoryPort) => new RegisterUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
  ],
  exports: [RegisterUserUseCase],
})
export class AuthModule {}
```
