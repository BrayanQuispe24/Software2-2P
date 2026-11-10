import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('api/churn')
export class ChurnGatewayController {
  private readonly churnServiceUrl: string;

  constructor(private readonly config: ConfigService) {
    const rawUrl = (
      this.config.get<string>('CHURN_SERVICE_URL') ||
      this.config.get<string>('ML_SERVICE_URL') ||
      'http://ms-machine-learning:8000'
    )
      .trim()
      .replace(/\/+$/, '');
    this.churnServiceUrl = rawUrl;
  }

  @Get('health')
  async healthCheck(@Res() res: Response) {
    try {
      const response = await fetch(`${this.churnServiceUrl}/health/ready`);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        status: 'unavailable',
        message: `El motor de Machine Learning no responde en ${this.churnServiceUrl}.`,
      });
    }
  }

  @Get('summary')
  async getChurnSummary(@Res() res: Response) {
    try {
      // 1. Verificar estado del modelo
      const readyResp = await fetch(`${this.churnServiceUrl}/health/ready`);
      const readyData = await readyResp.json();

      // 2. Ejecutar inferencia de muestra con clientes de referencia
      const sampleIds = ['SOCIO-001', 'SOCIO-002', 'SOCIO-003', 'SOCIO-004', 'SOCIO-005'];
      const predResp = await fetch(`${this.churnServiceUrl}/api/v1/predictions/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientes_ids: sampleIds }),
      });

      if (!predResp.ok) {
        throw new Error(`Fallo en inferencia batch: HTTP ${predResp.status}`);
      }

      const predData = await predResp.json();
      const predicciones: any[] = predData.predicciones || [];
      const total = predicciones.length;

      const conteo = { BAJO: 0, MEDIO: 0, ALTO: 0 };
      for (const p of predicciones) {
        if (p.nivel_riesgo === 'ALTO') conteo.ALTO++;
        else if (p.nivel_riesgo === 'MEDIO') conteo.MEDIO++;
        else conteo.BAJO++;
      }

      const tasaRiesgoAlto = total > 0 ? Math.round((conteo.ALTO / total) * 1000) / 10 : 0;
      const tasaRiesgoMedio = total > 0 ? Math.round((conteo.MEDIO / total) * 1000) / 10 : 0;
      const tasaRiesgoBajo = total > 0 ? Math.round((conteo.BAJO / total) * 1000) / 10 : 0;

      return res.status(HttpStatus.OK).json({
        estado: readyData.model_loaded ? 'ACTIVO' : 'CALENTANDO',
        modelo_version: readyData.active_model_version || '1.0.0',
        algoritmo: 'Random Forest Classifier (Calibrado)',
        total_evaluados: total,
        tasa_riesgo_alto_pct: tasaRiesgoAlto,
        tasa_riesgo_medio_pct: tasaRiesgoMedio,
        tasa_riesgo_bajo_pct: tasaRiesgoBajo,
        distribucion: conteo,
        predicciones_muestra: predicciones.map((p) => ({
          cliente_id: p.cliente_id,
          probabilidad: Math.round(p.probabilidad_abandono * 100),
          nivel_riesgo: p.nivel_riesgo,
          factores: p.factores_relevantes || [],
          recomendaciones: p.recomendaciones || [],
        })),
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        estado: 'OFFLINE',
        message: `No se pudo conectar con el motor de ML: ${error.message}`,
        tasa_riesgo_alto_pct: 0,
        distribucion: { BAJO: 0, MEDIO: 0, ALTO: 0 },
      });
    }
  }

  @Post('predict')
  async predictIndividual(@Body() body: any, @Res() res: Response) {
    try {
      const response = await fetch(`${this.churnServiceUrl}/api/v1/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'ml_service_error',
        message: `Error al comunicar con el motor de ML: ${error.message}`,
      });
    }
  }
}
