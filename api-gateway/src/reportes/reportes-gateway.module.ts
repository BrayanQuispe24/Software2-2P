import { Module } from '@nestjs/common';
import { ReportesGatewayController } from './reportes-gateway.controller.js';

@Module({
  controllers: [ReportesGatewayController],
})
export class ReportesGatewayModule {}

