import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentesGatewayController } from './agentes-gateway.controller.js';

@Module({
  imports: [ConfigModule],
  controllers: [AgentesGatewayController],
})
export class AgentesGatewayModule {}

