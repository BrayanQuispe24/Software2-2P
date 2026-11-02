import { Module } from '@nestjs/common';
import { LoginService } from './login.service.js';
import { PrismaModule } from '../../infrastructure/adapters/out/persistence/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [LoginService],
  exports: [LoginService],
})
export class LoginModule {}
