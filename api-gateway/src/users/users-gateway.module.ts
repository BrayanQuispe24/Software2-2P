import { Module } from '@nestjs/common';
import { UsersGatewayController } from './users-gateway.controller.js';

@Module({
  controllers: [UsersGatewayController],
})
export class UsersGatewayModule {}
