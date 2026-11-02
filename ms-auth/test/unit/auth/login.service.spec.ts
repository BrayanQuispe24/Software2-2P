import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as argon2 from 'argon2';
import { LoginService } from '../../../src/auth/login/login.service.js';
import { PrismaService } from '../../../src/prisma/prisma.service.js';

describe('LoginService', () => {
  let service: LoginService;
  let prismaMock: {
    user: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      user: {
        findFirst: vi.fn(),
      },
    };
    service = new LoginService(prismaMock as unknown as PrismaService);
  });

  it('debe retornar null si no se proporciona identifier o password', async () => {
    expect(await service.validateCredentials('', 'password123')).toBeNull();
    expect(await service.validateCredentials('user@test.com', '')).toBeNull();
  });

  it('debe retornar null si el usuario no existe en la base de datos', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const result = await service.validateCredentials('unknown@test.com', 'password123');

    expect(result).toBeNull();
  });

  it('debe retornar null si el usuario está inactivo', async () => {
    const passwordHash = await argon2.hash('correct_password');
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'uuid-123',
      email: 'user@test.com',
      estado: 'INACTIVO',
      passwordHash,
      deletedAt: null,
    });

    const result = await service.validateCredentials('user@test.com', 'correct_password');

    expect(result).toBeNull();
  });

  it('debe retornar null si la contraseña es incorrecta', async () => {
    const passwordHash = await argon2.hash('correct_password');
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'uuid-123',
      email: 'user@test.com',
      estado: 'ACTIVO',
      passwordHash,
      deletedAt: null,
    });

    const result = await service.validateCredentials('user@test.com', 'wrong_password');

    expect(result).toBeNull();
  });

  it('debe retornar el id del usuario cuando las credenciales son válidas', async () => {
    const passwordHash = await argon2.hash('correct_password');
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'uuid-12345',
      email: 'user@test.com',
      estado: 'ACTIVO',
      passwordHash,
      deletedAt: null,
    });

    const result = await service.validateCredentials('user@test.com', 'correct_password');

    expect(result).toBe('uuid-12345');
  });
});
