import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Permitir que Express confíe en proxies inversos (Nginx, Cloudflare, etc.)
  // para que req.protocol, req.secure y las cabeceras X-Forwarded-* (https, host) se respeten
  app.set('trust proxy', 1);

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`MS Auth en http://localhost:${port}`);
}
await bootstrap();
