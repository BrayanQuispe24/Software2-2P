import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  Res,
  Body,
  UnauthorizedException,
  ForbiddenException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('api/reportes')
export class ReportesGatewayController {
  private readonly logger = new Logger(ReportesGatewayController.name);
  private readonly reportesServiceUrl: string;
  private readonly internalToken: string;

  constructor(private readonly config: ConfigService) {
    this.reportesServiceUrl = this.config.get('REPORTES_SERVICE_URL', 'http://ms-mcp:8090/api/v1');
    this.internalToken = this.config.get('REPORTES_INTERNAL_TOKEN', 'mcp_gateway_1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c');
  }

  private validateAuth(req: Request, requireAdmin = false) {
    const user = req.session?.user;
    if (!user) {
      throw new UnauthorizedException('No hay sesión activa para acceder a los Reportes Inteligentes.');
    }

    const roles = user.roles || [];
    const isAuthorized = roles.includes('ADMINISTRADOR') || roles.includes('RECEPCIONISTA') || roles.includes('ENTRENADOR');

    if (!isAuthorized) {
      throw new ForbiddenException('No cuentas con permisos para acceder a Reportes Inteligentes MCP.');
    }

    if (requireAdmin && !roles.includes('ADMINISTRADOR')) {
      throw new ForbiddenException('Se requiere rol ADMINISTRADOR para gestionar tokens o ver auditoría completa.');
    }

    return user;
  }

  private internalHeaders(req: Request): Record<string, string> {
    const user = this.validateAuth(req);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.internalToken}`,
      'X-Actor-Role': user.roles?.includes('ADMINISTRADOR') ? 'ADMINISTRADOR' : 'LECTOR',
      'X-Actor-Id': user.email || user.name || 'usuario-autenticado',
    };
  }

  @Get('capacidades')
  async getCapacidades(@Req() req: Request, @Res() res: Response) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.reportesServiceUrl}/capacidades`, {
        headers: this.internalHeaders(req),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      this.logger.error(`Error consultando capacidades: ${err.message}`);
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'No se pudo conectar con ms-mcp' });
    }
  }

  @Get('herramientas')
  async getHerramientas(@Req() req: Request, @Res() res: Response) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.reportesServiceUrl}/tools`, {
        headers: this.internalHeaders(req),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      this.logger.error(`Error consultando herramientas: ${err.message}`);
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'No se pudo conectar con ms-mcp' });
    }
  }

  @Post('consultas')
  async executeReport(@Req() req: Request, @Res() res: Response, @Body() body: Record<string, any>) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.reportesServiceUrl}/tools/execute`, {
        method: 'POST',
        headers: this.internalHeaders(req),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      this.logger.error(`Error ejecutando reporte: ${err.message}`);
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'Fallo al ejecutar herramienta de reporte en ms-mcp' });
    }
  }

  @Post('exportar')
  async exportReport(@Req() req: Request, @Res() res: Response, @Body() body: Record<string, any>) {
    this.validateAuth(req);
    try {
      const response = await fetch(`${this.reportesServiceUrl}/exportar`, {
        method: 'POST',
        headers: this.internalHeaders(req),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      this.logger.error(`Error solicitando exportación: ${err.message}`);
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'Fallo al generar archivo de exportación en ms-mcp' });
    }
  }

  @Get('descargas/:fileId')
  async downloadFile(@Req() req: Request, @Res() res: Response, @Param('fileId') fileId: string) {
    // Las descargas pueden ser autenticadas o directas
    try {
      const response = await fetch(`${this.reportesServiceUrl}/descargas/${encodeURIComponent(fileId)}`, {
        headers: { 'Authorization': `Bearer ${this.internalToken}` },
      });

      if (!response.ok) {
        return res.status(response.status).json({ message: 'Archivo no encontrado o expirado' });
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const disposition = response.headers.get('content-disposition') || `attachment; filename="${fileId}"`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', disposition);

      const arrayBuffer = await response.arrayBuffer();
      return res.status(HttpStatus.OK).send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      this.logger.error(`Error descargando archivo: ${err.message}`);
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'Error recuperando archivo desde ms-mcp' });
    }
  }

  @Get('tokens')
  async listTokens(@Req() req: Request, @Res() res: Response) {
    this.validateAuth(req, true);
    try {
      const response = await fetch(`${this.reportesServiceUrl}/tokens`, {
        headers: this.internalHeaders(req),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'Error consultando tokens' });
    }
  }

  @Post('tokens')
  async createToken(@Req() req: Request, @Res() res: Response, @Body() body: Record<string, any>) {
    this.validateAuth(req, true);
    try {
      const response = await fetch(`${this.reportesServiceUrl}/tokens`, {
        method: 'POST',
        headers: this.internalHeaders(req),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'Error creando token' });
    }
  }

  @Delete('tokens/:tokenId')
  async revokeToken(@Req() req: Request, @Res() res: Response, @Param('tokenId') tokenId: string) {
    this.validateAuth(req, true);
    try {
      const response = await fetch(`${this.reportesServiceUrl}/tokens/${encodeURIComponent(tokenId)}`, {
        method: 'DELETE',
        headers: this.internalHeaders(req),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'Error revocando token' });
    }
  }

  @Get('auditoria')
  async getAudit(@Req() req: Request, @Res() res: Response, @Query('limit') limit?: number) {
    this.validateAuth(req, true);
    try {
      const response = await fetch(`${this.reportesServiceUrl}/audit?limit=${limit || 50}`, {
        headers: this.internalHeaders(req),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({ message: 'Error consultando auditoría' });
    }
  }
}
