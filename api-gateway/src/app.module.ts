import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { UsersGatewayModule } from './users/users-gateway.module.js';
import { IaGatewayModule } from './ia/ia-gateway.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersGatewayModule,
    IaGatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
