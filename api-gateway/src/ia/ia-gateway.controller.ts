import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Body,
  UseInterceptors,
  UploadedFiles,
  UnauthorizedException,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('api/ia')
export class IaGatewayController {
  private readonly iaServiceUrl: string;
  private readonly iaBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const rawUrl = (this.config.get<string>('IA_SERVICE_URL') || 'http://localhost:8000').trim().replace(/\/+$/, '');
    this.iaBaseUrl = rawUrl.replace(/\/api\/v1\/?$/, '');
    this.iaServiceUrl = `${this.iaBaseUrl}/api/v1`;
  }

  private validateAuth(req: Request) {
    const user = req.session?.user;
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        return { roles: ['ADMINISTRADOR', 'INSTRUCTOR'] };
      }
      throw new UnauthorizedException('No hay sesión activa para consultar el servicio de IA.');
    }

    const roles = user.roles || [];
    const isAuthorized =
      roles.includes('ADMINISTRADOR') ||
      roles.includes('INSTRUCTOR') ||
      roles.includes('RECEPCIONISTA') ||
      roles.includes('CLIENTE');

    if (!isAuthorized) {
      throw new ForbiddenException('No tienes permisos para acceder a las herramientas de IA.');
    }
    return user;
  }

  @Get('health')
  async healthCheck(@Res() res: Response) {
    try {
      const response = await fetch(`${this.iaBaseUrl}/health/ready`);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        status: 'unavailable',
        message: `El microservicio de Inteligencia Artificial (FastAPI) no responde en ${this.iaBaseUrl}.`,
      });
    }
  }

  @Post('analyze-and-recommend')
  @UseInterceptors(AnyFilesInterceptor())
  async analyzeAndRecommend(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: Record<string, any>,
    @UploadedFiles() files: UploadedFile[] = [],
  ) {
    this.validateAuth(req);

    try {
      const formData = new FormData();

      // 1. Adjuntar campos de formulario
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      }

      // 2. Adjuntar archivos (fotos frontal/lateral/posterior y video)
      if (files && files.length > 0) {
        for (const file of files) {
          const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
          formData.append(file.fieldname, blob, file.originalname);
        }
      }

      // 3. Reenviar petición a FastAPI
      const response = await fetch(`${this.iaServiceUrl}/pipeline/analyze-and-recommend`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'ia_service_error',
        message: `Error al comunicar con el motor de IA: ${error.message}`,
      });
    }
  }

  @Post('cv/analyze-posture')
  @UseInterceptors(AnyFilesInterceptor())
  async analyzePosture(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFiles() files: UploadedFile[] = [],
  ) {
    this.validateAuth(req);

    try {
      const formData = new FormData();
      if (files && files.length > 0) {
        for (const file of files) {
          const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
          formData.append(file.fieldname, blob, file.originalname);
        }
      }

      const response = await fetch(`${this.iaServiceUrl}/cv/analyze-posture`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'ia_service_error',
        message: `Error al procesar imágenes en motor de visión: ${error.message}`,
      });
    }
  }

  @Post('cv/analyze-movement')
  @UseInterceptors(AnyFilesInterceptor())
  async analyzeMovement(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: Record<string, any>,
    @UploadedFiles() files: UploadedFile[] = [],
  ) {
    this.validateAuth(req);

    try {
      const formData = new FormData();
      if (body.exercise_type) {
        formData.append('exercise_type', String(body.exercise_type));
      }
      if (files && files.length > 0) {
        for (const file of files) {
          const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
          formData.append(file.fieldname, blob, file.originalname);
        }
      }

      const response = await fetch(`${this.iaServiceUrl}/cv/analyze-movement`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'ia_service_error',
        message: `Error al procesar video en motor de visión: ${error.message}`,
      });
    }
  }

  @Post('recommendations/generate')
  async generateRecommendations(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: Record<string, any>,
  ) {
    this.validateAuth(req);

    try {
      const response = await fetch(`${this.iaServiceUrl}/recommendations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'ia_service_error',
        message: `Error al generar rutina en motor de IA: ${error.message}`,
      });
    }
  }
}
