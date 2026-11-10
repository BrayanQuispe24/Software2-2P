import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { NotificationsService, PushNotificationPayload } from './notifications.service.js';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('health')
  getHealth(@Res() res: Response) {
    const ready = this.notificationsService.isReady();
    return res.status(ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      service: 'Firebase Cloud Messaging (Push Notifications)',
      status: ready ? 'READY' : 'CREDENTIALS_MISSING',
      timestamp: new Date().toISOString(),
    });
  }

  @Post('send')
  async sendPushNotification(@Body() payload: PushNotificationPayload, @Res() res: Response) {
    if (!payload.title || !payload.body) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        ok: false,
        error: 'Los campos "title" y "body" son obligatorios.',
      });
    }

    const result = await this.notificationsService.sendPush(payload);
    if (!result.success) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        ok: false,
        error: result.error,
      });
    }

    return res.status(HttpStatus.OK).json({
      ok: true,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    });
  }

  @Post('broadcast')
  async broadcastNotification(
    @Body() body: { topic?: string; title: string; body: string; data?: Record<string, string> },
    @Res() res: Response,
  ) {
    const topic = body.topic || 'socios';
    const result = await this.notificationsService.sendPush({
      topic,
      title: body.title,
      body: body.body,
      data: body.data,
    });

    if (!result.success) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        ok: false,
        error: result.error,
      });
    }

    return res.status(HttpStatus.OK).json({
      ok: true,
      topic,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    });
  }
}

