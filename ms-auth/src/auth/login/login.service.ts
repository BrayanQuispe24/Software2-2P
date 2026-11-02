import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class LoginService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCredentials(
    identifier: string,
    password: string,
  ): Promise<string | null> {
    if (!identifier || !password) {
      return null;
    }

    const term = identifier.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { email: term.toLowerCase() },
          { codigo: term.toUpperCase() },
          { ci: term },
        ],
      },
    });

    if (!user || user.estado !== 'ACTIVO' || !user.passwordHash) {
      return null;
    }

    try {
      const valid = await argon2.verify(user.passwordHash, password);
      if (!valid) {
        return null;
      }
      return String(user.id);
    } catch {
      return null;
    }
  }
}
