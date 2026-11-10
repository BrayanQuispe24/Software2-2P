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
      throw new UnauthorizedException('No hay sesión activa para consultar el Centro de Monitoreo Inteligente.');
    }

    const roles = user.roles || [];
    const isAuthorized = roles.includes('ADMINISTRADOR') || roles.includes('RECEPCIONISTA');

    if (!isAuthorized) {
      throw new ForbiddenException('No cuentas con permisos para acceder al sistema de Agentes Inteligentes.');
    }

    if (requireAdmin && !roles.includes('ADMINISTRADOR')) {
      throw new ForbiddenException('Se requiere rol ADMINISTRADOR para autorizar acciones sensibles o modificar reglas.');
    }

    return user;
  }

  private internalHeaders(req: Request): Record<string, string> {
    const user = this.validateAuth(req);
    return {
      'Content-Type': 'application/json',
      'X-Internal-Token': this.config.getOrThrow<string>('AGENTES_INTERNAL_TOKEN'),
      'X-Actor-Role': user.roles?.includes('ADMINISTRADOR') ? 'ADMINISTRADOR' : 'LECTOR',
      'X-Actor-Id': user.email || user.name || 'usuario-autenticado',
    };
  }

  @Put('agentes/:tipo')
  async configureAgent(@Req() req: Request, @Res() res: Response, @Param('tipo') tipo: string, @Body() body: Record<string, unknown>) {
    this.validateAuth(req, true);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/agentes/${encodeURIComponent(tipo)}`, {
        method: 'PUT', headers: this.internalHeaders(req), body: JSON.stringify(body),
      });
      return res.status(response.status).json(await response.json());
    } catch {
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'No se pudo actualizar la configuración del agente.' });
    }
  }

  @Get('acciones')
  async listActions(@Req() req: Request, @Res() res: Response) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/acciones`, { headers: this.internalHeaders(req) });
      return res.status(response.status).json(await response.json());
    } catch {
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'No se pudieron consultar las acciones.' });
    }
  }

  @Post('acciones/:id/ejecutar')
  async executeApprovedAction(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    this.validateAuth(req, true);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/acciones/${encodeURIComponent(id)}/ejecutar`, {
        method: 'POST', headers: this.internalHeaders(req),
      });
      return res.status(response.status).json(await response.json());
    } catch {
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'No se pudo confirmar el despacho de la propuesta.' });
    }
  }

  @Get('health')
  async healthCheck(@Req() req: Request, @Res() res: Response) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/health/ready`, { headers: this.internalHeaders(req) });
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
      const response = await fetch(`${this.agentesServiceUrl}/dashboard/summary`, { headers: this.internalHeaders(req) });
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
      const response = await fetch(`${this.agentesServiceUrl}/alertas${qs ? `?${qs}` : ''}`, { headers: this.internalHeaders(req) });
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
      const response = await fetch(`${this.agentesServiceUrl}/alertas/${encodeURIComponent(id)}`, { headers: this.internalHeaders(req) });
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
      const response = await fetch(`${this.agentesServiceUrl}/alertas/${encodeURIComponent(id)}/estado`, {
        method: 'PATCH',
        headers: this.internalHeaders(req),
        body: JSON.stringify({
          ...body,
          responsable: user.email || user.name,
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
      const response = await fetch(`${this.agentesServiceUrl}/alertas/${encodeURIComponent(id)}/explicacion-ia`, {
        method: 'PATCH',
        headers: this.internalHeaders(req),
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
        headers: this.internalHeaders(req),
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

  @Get('reglas')
  async listReglas(@Req() req: Request, @Res() res: Response) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/reglas`, { headers: this.internalHeaders(req) });
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
      const response = await fetch(`${this.agentesServiceUrl}/reglas/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.internalHeaders(req),
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
      const response = await fetch(`${this.agentesServiceUrl}/acciones/${encodeURIComponent(id)}/autorizar`, {
        method: 'POST',
        headers: this.internalHeaders(req),
        body: JSON.stringify({
          ...body,
          accion_id: id,
          aprobado_por: user.email || user.name,
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
        headers: this.internalHeaders(req),
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

  @Post('seed-data')
  async seedRealData(@Req() req: Request, @Res() res: Response) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/seed-data`, {
        method: 'POST',
        headers: this.internalHeaders(req),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'agentes_service_error',
        message: `Error al cargar datos en ms-agentes: ${error.message}`,
      });
    }
  }

  @Get('historial')
  async getHistorial(@Req() req: Request, @Res() res: Response, @Query('limit') limit = '50') {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.agentesServiceUrl}/historial?limit=${encodeURIComponent(limit)}`, { headers: this.internalHeaders(req) });
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

