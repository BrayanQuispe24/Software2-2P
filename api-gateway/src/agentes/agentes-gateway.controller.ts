import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Query,
  Req,
  Res,
  Body,
  UnauthorizedException,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('api/agentes')
export class AgentesGatewayController {
  private readonly agentesServiceUrl: string;

  constructor(private readonly config: ConfigService) {
    this.agentesServiceUrl = this.config.get('AGENTES_SERVICE_URL', 'http://localhost:8085/api/v1');
  }

  private validateAuth(req: Request, requireAdmin = false) {
    const user = req.session?.user;
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        return { roles: ['ADMINISTRADOR'], email: 'dev-admin@apexfitness.com', name: 'Dev Admin' };
      }
      throw new UnauthorizedException('No hay sesión activa para consultar el Centro de Monitoreo Inteligente.');
    }

    const roles = user.roles || [];
    const isAuthorized = roles.includes('ADMINISTRADOR') || roles.includes('RECEPCIONISTA') || roles.includes('INSTRUCTOR');

    if (!isAuthorized) {
      throw new ForbiddenException('No cuentas con permisos para acceder al sistema de Agentes Inteligentes.');
    }

    if (requireAdmin && !roles.includes('ADMINISTRADOR')) {
      throw new ForbiddenException('Se requiere rol ADMINISTRADOR para autorizar acciones sensibles o modificar reglas.');
    }

    return user;
  }

  @Get('health')
  async healthCheck(@Res() res: Response) {
    try {
      const response = await fetch(`${this.agentesServiceUrl}/health/ready`);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        status: 'unavailable',
        message: 'El microservicio ms-agentes (FastAPI) no responde en el puerto 8085.',
      });
    }
  }

  @Get('dashboard/summary')
  async getSummary(@Req() req: Request, @Res() res: Response) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/dashboard/summary`);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al conectar con ms-agentes: ${error.message}`,
      });
    }
  }

  @Get('alertas')
  async listAlertas(@Req() req: Request, @Res() res: Response, @Query() query: Record<string, string>) {
    this.validateAuth(req);
    try {
      const qs = new URLSearchParams(query).toString();
      const response = await fetch(`${this.agentesServiceUrl}/alertas${qs ? `?${qs}` : ''}`);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al obtener alertas: ${error.message}`,
      });
    }
  }

  @Get('alertas/:id')
  async getAlertaDetail(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/alertas/${id}`);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al consultar alerta: ${error.message}`,
      });
    }
  }

  @Patch('alertas/:id/estado')
  async updateAlertaEstado(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    const user = this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/alertas/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          responsable: body.responsable || user.name || user.email,
        }),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al actualizar estado de alerta: ${error.message}`,
      });
    }
  }

  @Patch('alertas/:id/explicacion-ia')
  async syncBrowserAiExplanation(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/alertas/${id}/explicacion-ia`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al sincronizar explicación de IA local: ${error.message}`,
      });
    }
  }

  @Post('evaluaciones/ejecutar')
  async executeEvaluation(@Req() req: Request, @Res() res: Response, @Body() body: Record<string, any>) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/evaluaciones/ejecutar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al ejecutar evaluación de monitoreo: ${error.message}`,
      });
    }
  }

  @Post('simulador/aforo')
  async simulateAforo(@Req() req: Request, @Res() res: Response, @Body() body: Record<string, any>) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/simulador/aforo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error en simulador de aforo: ${error.message}`,
      });
    }
  }

  @Get('reglas')
  async listReglas(@Req() req: Request, @Res() res: Response) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/reglas`);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al obtener reglas: ${error.message}`,
      });
    }
  }

  @Put('reglas/:id')
  async updateRegla(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    this.validateAuth(req, true); // Requiere Administrador
    try {
      const response = await fetch(`${this.agentesServiceUrl}/reglas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al actualizar regla: ${error.message}`,
      });
    }
  }

  @Post('acciones/:id/autorizar')
  async authorizeAction(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    const user = this.validateAuth(req, true); // Requiere Administrador explícito (Nivel 4)
    try {
      const response = await fetch(`${this.agentesServiceUrl}/acciones/${id}/autorizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          accion_id: id,
          aprobado_por: user.email || user.name || 'admin@apexfitness.com',
        }),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al autorizar acción sensible: ${error.message}`,
      });
    }
  }

  @Post('tools/execute')
  async executeTool(@Req() req: Request, @Res() res: Response, @Body() body: Record<string, any>) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/tools/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al ejecutar herramienta de agente: ${error.message}`,
      });
    }
  }

  @Get('historial')
  async getHistorial(@Req() req: Request, @Res() res: Response, @Query('limit') limit = '50') {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/historial?limit=${limit}`);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al obtener historial de decisiones: ${error.message}`,
      });
    }
  }
}

