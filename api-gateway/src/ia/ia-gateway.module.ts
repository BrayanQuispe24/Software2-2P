import { Module } from '@nestjs/common';
import { IaGatewayController } from './ia-gateway.controller.js';

@Module({
  controllers: [IaGatewayController],
})
export class IaGatewayModule {}
