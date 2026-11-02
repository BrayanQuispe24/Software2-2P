import fs from 'node:fs';
import path from 'node:path';

const controllerPath = path.resolve('..', 'api-gateway', 'src', 'users', 'users-gateway.controller.ts');

const content = `import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  Res,
  Body,
  UnauthorizedException,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('api/users')
export class UsersGatewayController {
  private readonly authServerUrl: string;

  constructor(private readonly config: ConfigService) {
    this.authServerUrl = this.config.get('AUTH_SERVER_URL', 'http://localhost:4000');
  }

  @Get()
  async findAll(@Req() req: Request, @Res() res: Response) {
    const user = req.session.user;
    if (!user) {
      throw new UnauthorizedException('No hay sesión activa.');
    }

    const roles = user.roles || [];
    const canView = roles.includes('ADMINISTRADOR') || roles.includes('RECEPCIONISTA');
    if (!canView) {
      throw new ForbiddenException('No cuentas con permisos para listar usuarios.');
    }

    try {
      const response = await fetch(\`\${this.authServerUrl}/users\`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(req.session.accessToken ? { Authorization: \`Bearer \${req.session.accessToken}\` } : {}),
        },
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'bad_gateway',
        message: 'No se pudo contactar al microservicio de autenticación',
      });
    }
  }

  @Post()
  async create(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    const user = req.session.user;
    if (!user) {
      throw new UnauthorizedException('No hay sesión activa.');
    }

    const roles = user.roles || [];
    const isAdmin = roles.includes('ADMINISTRADOR');
    const isRecep = roles.includes('RECEPCIONISTA');

    if (!isAdmin && !isRecep) {
      throw new ForbiddenException('No cuentas con permisos para dar de alta usuarios.');
    }

    // Un recepcionista solo puede registrar clientes
    if (isRecep && !isAdmin && body.role && body.role !== 'CLIENTE') {
      throw new ForbiddenException('Los recepcionistas solo están autorizados a dar de alta clientes.');
    }

    try {
      const response = await fetch(\`\${this.authServerUrl}/users\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(req.session.accessToken ? { Authorization: \`Bearer \${req.session.accessToken}\` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'bad_gateway',
        message: 'No se pudo contactar al microservicio de autenticación',
      });
    }
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = req.session.user;
    if (!user) {
      throw new UnauthorizedException('No hay sesión activa.');
    }

    const roles = user.roles || [];
    const isAdmin = roles.includes('ADMINISTRADOR');
    const isRecep = roles.includes('RECEPCIONISTA');

    if (!isAdmin && !isRecep) {
      throw new ForbiddenException('No cuentas con permisos para actualizar usuarios.');
    }

    if (isRecep && !isAdmin && body.tipoUsuario && body.tipoUsuario !== 'CLIENTE') {
      throw new ForbiddenException('Los recepcionistas solo pueden gestionar usuarios con rol CLIENTE.');
    }

    try {
      const response = await fetch(\`\${this.authServerUrl}/users/\${id}\`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(req.session.accessToken ? { Authorization: \`Bearer \${req.session.accessToken}\` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'bad_gateway',
        message: 'No se pudo contactar al microservicio de autenticación',
      });
    }
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const user = req.session.user;
    if (!user) {
      throw new UnauthorizedException('No hay sesión activa.');
    }

    const roles = user.roles || [];
    const isAdmin = roles.includes('ADMINISTRADOR');

    if (!isAdmin) {
      throw new ForbiddenException('Solo los administradores pueden desactivar usuarios.');
    }

    try {
      const response = await fetch(\`\${this.authServerUrl}/users/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(req.session.accessToken ? { Authorization: \`Bearer \${req.session.accessToken}\` } : {}),
        },
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'bad_gateway',
        message: 'No se pudo contactar al microservicio de autenticación',
      });
    }
  }
}
`;

fs.writeFileSync(controllerPath, content, 'utf8');
console.log('Updated UsersGatewayController with PATCH and DELETE methods.');
