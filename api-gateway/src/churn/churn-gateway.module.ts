import { Module } from '@nestjs/common';
import { ChurnGatewayController } from './churn-gateway.controller.js';

@Module({
  controllers: [ChurnGatewayController],
})
export class ChurnGatewayModule {}
