import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './infrastructure/adapters/out/persistence/prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthOidcModule } from './oidc/oidc.module.js';
import { LoginModule } from './auth/login/login.module.js';
import { SecurityModule } from './security/security.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    LoginModule,
    AuthOidcModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
