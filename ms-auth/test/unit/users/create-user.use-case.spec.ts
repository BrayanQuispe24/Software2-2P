import { describe, it, expect, beforeEach } from 'vitest';
import { CreateUserUseCase } from '../../../src/users/application/use-cases/create-user.use-case.js';
import { UserRepositoryPort } from '../../../src/users/application/ports/out/user-repository.port.js';
import { PasswordHasherPort } from '../../../src/users/application/ports/out/password-hasher.port.js';
import { User } from '../../../src/users/domain/entities/user.entity.js';
import { UserAlreadyExistsError } from '../../../src/users/domain/errors/user-already-exists.error.js';

class InMemoryUserRepository implements UserRepositoryPort {
  private users: User[] = [];

  async save(user: User): Promise<void> {
    this.users.push(user);
  }

  async update(user: User): Promise<void> {
    const idx = this.users.findIndex((u) => u.getId() === user.getId());
    if (idx !== -1) this.users[idx] = user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.getId() === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.getEmail() === email.toLowerCase()) ?? null;
  }

  async findByCodigo(codigo: string): Promise<User | null> {
    return this.users.find((u) => u.getCodigo() === codigo.toUpperCase()) ?? null;
  }

  async findByCi(ci: string): Promise<User | null> {
    return this.users.find((u) => u.getCi() === ci) ?? null;
  }

  async findForAuth(identifier: string): Promise<User | null> {
    const term = identifier.toLowerCase();
    return this.users.find((u) => u.getEmail() === term || u.getCodigo().toLowerCase() === term) ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }
}

class FakePasswordHasher implements PasswordHasherPort {
  async hash(plain: string): Promise<string> {
    return `hashed_${plain}`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed_${plain}`;
  }
}

describe('CreateUserUseCase (Hexagonal Unit Test)', () => {
  let useCase: CreateUserUseCase;
  let repo: InMemoryUserRepository;
  let hasher: FakePasswordHasher;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();
    useCase = new CreateUserUseCase(repo, hasher);
  });

  it('debe crear un usuario con todos los campos personalizados y contraseña hasheada', async () => {
    const result = await useCase.execute({
      codigo: 'USR-001',
      nombre: 'Juan',
      apellido: 'Perez',
      ci: '1234567',
      celular: '70012345',
      email: 'juan.perez@test.com',
      password: 'SecurePassword123!',
      tipoUsuario: 'DOCENTE',
      aceptaTerminos: true,
    });

    expect(result.id).toBeDefined();
    expect(result.codigo).toBe('USR-001');
    expect(result.nombre).toBe('Juan');
    expect(result.apellido).toBe('Perez');
    expect(result.ci).toBe('1234567');
    expect(result.celular).toBe('70012345');
    expect(result.email).toBe('juan.perez@test.com');
    expect(result.tipoUsuario).toBe('DOCENTE');
    expect(result.estado).toBe('ACTIVO');
    expect(result.aceptaTerminos).toBe(true);
    expect(result.fechaAceptaTerminos).toBeInstanceOf(Date);

    // Comprobar que en persistencia se guardó el hash y no la contraseña plana
    const saved = await repo.findById(result.id);
    expect(saved?.getPasswordHash()).toBe('hashed_SecurePassword123!');
  });

  it('debe lanzar UserAlreadyExistsError si el email ya existe', async () => {
    await useCase.execute({
      codigo: 'USR-001',
      nombre: 'Juan',
      apellido: 'Perez',
      ci: '1234567',
      celular: '70012345',
      email: 'juan@test.com',
      password: 'password12345',
    });

    await expect(
      useCase.execute({
        codigo: 'USR-002',
        nombre: 'Pedro',
        apellido: 'Gomez',
        ci: '7654321',
        celular: '70099999',
        email: 'juan@test.com',
        password: 'password12345',
      }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  it('debe lanzar UserAlreadyExistsError si el código ya existe', async () => {
    await useCase.execute({
      codigo: 'DUPLICATE-COD',
      nombre: 'Juan',
      apellido: 'Perez',
      ci: '1111111',
      celular: '70012345',
      email: 'juan1@test.com',
      password: 'password12345',
    });

    await expect(
      useCase.execute({
        codigo: 'DUPLICATE-COD',
        nombre: 'Pedro',
        apellido: 'Gomez',
        ci: '2222222',
        celular: '70099999',
        email: 'juan2@test.com',
        password: 'password12345',
      }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  it('debe lanzar UserAlreadyExistsError si el CI ya existe', async () => {
    await useCase.execute({
      codigo: 'COD-1',
      nombre: 'Juan',
      apellido: 'Perez',
      ci: 'CI-123',
      celular: '70012345',
      email: 'juan1@test.com',
      password: 'password12345',
    });

    await expect(
      useCase.execute({
        codigo: 'COD-2',
        nombre: 'Pedro',
        apellido: 'Gomez',
        ci: 'CI-123',
        celular: '70099999',
        email: 'juan2@test.com',
        password: 'password12345',
      }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });
});
