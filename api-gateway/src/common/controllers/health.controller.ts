import { Controller, Get, Head, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('health')
export class HealthController {
  @Head('ping')
  @HttpCode(HttpStatus.NO_CONTENT)
  pingHead(@Res() res: Response) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  @Get('ping')
  pingGet(@Res() res: Response) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(HttpStatus.OK).json({
      status: 'ok',
      online: true,
      timestamp: new Date().toISOString(),
      service: 'apex-api-gateway',
    });
  }
}

