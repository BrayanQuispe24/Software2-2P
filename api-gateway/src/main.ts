import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  const cookieSecure = config.get('COOKIE_SECURE') === 'true';
  const cookieDomain = config.get<string>('COOKIE_DOMAIN');

  app.use(
    session({
      name: 'gateway.sid',
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: 'lax',
        domain: cookieDomain || undefined,
        maxAge: 8 * 60 * 60 * 1000,
      },
    }),
  );

  const allowedOrigins = [
    config.get<string>('FRONTEND_URL'),
    'https://apexfitness.bratox.me',
    'https://api.apexfitness.bratox.me',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin: any, callback: any) => {
      if (
        !origin ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin.endsWith('.bratox.me') ||
        origin === 'https://bratox.me' ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  const port = Number(config.get('PORT') ?? 3000);
  await app.listen(port);
  console.log(`API Gateway iniciado en http://localhost:${port}`);
}
bootstrap();
