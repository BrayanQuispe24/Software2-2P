import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { Request, Response } from 'express';

interface CachedIdempotentResponse {
  status: 'PROCESSING' | 'COMPLETED';
  statusCode: number;
  body: any;
  createdAt: number;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  // Almacén en memoria con TTL (fallback seguro e instantáneo para dev y cluster)
  private static readonly memoryStore = new Map<string, CachedIdempotentResponse>();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 Horas

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const idempotencyKey = req.headers['x-idempotency-key'] as string;

    // Solo aplicar a mutaciones con header X-Idempotency-Key
    if (!idempotencyKey || req.method === 'GET' || req.method === 'HEAD') {
      return next.handle();
    }

    const cached = IdempotencyInterceptor.memoryStore.get(idempotencyKey);

    if (cached) {
      if (cached.status === 'PROCESSING') {
        this.logger.warn(`Petición concurrente detectada para Idempotency-Key: ${idempotencyKey}`);
        throw new ConflictException(
          'La operación ya se encuentra en proceso. Por favor espere unos momentos.'
        );
      }

      if (cached.status === 'COMPLETED') {
        this.logger.log(`Respuesta idempotente cacheada servida para key: ${idempotencyKey}`);
        res.status(cached.statusCode);
        res.setHeader('X-Cache-Lookup', 'HIT-IDEMPOTENT');
        return of(cached.body);
      }
    }

    // Registrar estado PROCESSING
    IdempotencyInterceptor.memoryStore.set(idempotencyKey, {
      status: 'PROCESSING',
      statusCode: 200,
      body: null,
      createdAt: Date.now(),
    });

    return next.handle().pipe(
      tap((body) => {
        const statusCode = res.statusCode || 200;
        IdempotencyInterceptor.memoryStore.set(idempotencyKey, {
          status: 'COMPLETED',
          statusCode,
          body,
          createdAt: Date.now(),
        });
        res.setHeader('X-Cache-Lookup', 'MISS-IDEMPOTENT-STORED');
      }),
      catchError((err) => {
        // En caso de error, liberar la llave para permitir reintentos válidos
        IdempotencyInterceptor.memoryStore.delete(idempotencyKey);
        return throwError(() => err);
      })
    );
  }
}

