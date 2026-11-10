import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';

export interface PushNotificationPayload {
  token?: string;
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: App | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const activeApps = getApps();
      if (activeApps.length > 0) {
        this.firebaseApp = activeApps[0];
        this.logger.log('🔥 Firebase Admin ya se encuentra inicializado.');
        return;
      }

      const explicitPath = this.config.get<string>('FIREBASE_CREDENTIALS_PATH');
      const candidatePaths = [
        explicitPath,
        path.resolve(process.cwd(), 'firebase-service-account.json'),
        path.resolve(process.cwd(), 'config', 'firebase-service-account.json'),
        '/app/firebase-service-account.json',
      ].filter(Boolean) as string[];

      let credentialsPath: string | null = null;
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          credentialsPath = p;
          break;
        }
      }

      if (!credentialsPath) {
        this.logger.warn(
          '⚠️ No se encontró el archivo firebase-service-account.json. Las notificaciones push permanecerán inactivas hasta que se proporcione el archivo.',
        );
        return;
      }

      const fileContent = fs.readFileSync(credentialsPath, 'utf8');
      const serviceAccount = JSON.parse(fileContent);

      this.firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });

      this.logger.log(
        `🔥 Firebase Admin inicializado exitosamente para el proyecto [${serviceAccount.project_id}] desde ${credentialsPath}`,
      );
    } catch (error: any) {
      this.logger.error(`❌ Error al inicializar Firebase Admin: ${error.message}`, error.stack);
    }
  }

  isReady(): boolean {
    return this.firebaseApp !== null;
  }

  async sendPush(payload: PushNotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isReady() || !this.firebaseApp) {
      return {
        success: false,
        error: 'Firebase Admin no está inicializado. Verifique el archivo firebase-service-account.json.',
      };
    }

    try {
      const notification = {
        title: payload.title,
        body: payload.body,
      };
      const data = payload.data || {};

      let message: Message;
      if (payload.token) {
        message = {
          token: payload.token,
          notification,
          data,
        };
      } else if (payload.topic) {
        message = {
          topic: payload.topic,
          notification,
          data,
        };
      } else {
        return {
          success: false,
          error: 'Debe especificar al menos un "token" de dispositivo o un "topic" para enviar la notificación.',
        };
      }

      const messageId = await getMessaging(this.firebaseApp).send(message);
      this.logger.log(`📲 Notificación push enviada exitosamente. ID: ${messageId}`);
      return { success: true, messageId };
    } catch (error: any) {
      this.logger.error(`❌ Error enviando notificación push: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }
}
