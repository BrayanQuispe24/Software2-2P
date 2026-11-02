import { Controller, Get, Optional } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './infrastructure/adapters/out/persistence/prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/db')
  async checkDatabase() {
    if (!this.prisma) {
      return {
        service: 'ms-auth',
        database: 'not_configured',
      };
    }
    const result = await this.prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    return {
      service: 'ms-auth',
      database: 'connected',
      result: result[0]?.ok,
    };
  }
}
