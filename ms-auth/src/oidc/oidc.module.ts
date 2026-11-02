import { Module } from '@nestjs/common';
import { OidcModule } from 'nest-oidc-provider';
import { createOidcConfig } from './oidc.config.js';
import { PrismaModule } from '../infrastructure/adapters/out/persistence/prisma/prisma.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginModule } from '../auth/login/login.module.js';
import { UsersModule } from '../users/users.module.js';
import { OidcInteractionController } from './interactions/oidc-interaction.controller.js';

@Module({
  imports: [
    PrismaModule,
    LoginModule,
    UsersModule,
    OidcModule.forRootAsync({
      imports: [PrismaModule],
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({
        issuer: process.env.OIDC_ISSUER ?? 'http://localhost:4000/oidc',
        path: process.env.OIDC_PATH ?? '/oidc',
        oidc: createOidcConfig(prisma),
      }),
    }),
  ],
  controllers: [OidcInteractionController],
})
export class AuthOidcModule {}
