import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('OIDC Provider (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /oidc/.well-known/openid-configuration devuelve los metadatos oficiales del servidor OIDC', async () => {
    const res = await request(app.getHttpServer())
      .get('/oidc/.well-known/openid-configuration')
      .expect(200);

    expect(res.body).toHaveProperty('issuer', 'http://localhost:4000/oidc');
    expect(res.body.authorization_endpoint).toMatch(/\/oidc\/auth$/);
    expect(res.body.token_endpoint).toMatch(/\/oidc\/token$/);
    expect(res.body.jwks_uri).toMatch(/\/oidc\/jwks$/);
    expect(res.body.response_types_supported).toContain('code');
    expect(res.body.grant_types_supported).toContain('authorization_code');
  });

  it('GET /oidc/jwks publica únicamente las claves públicas sin componentes privados', async () => {
    const res = await request(app.getHttpServer())
      .get('/oidc/jwks')
      .expect(200);

    expect(res.body).toHaveProperty('keys');
    expect(Array.isArray(res.body.keys)).toBe(true);
    expect(res.body.keys.length).toBeGreaterThan(0);

    const key = res.body.keys[0];
    expect(key.kty).toBe('RSA');
    expect(key.alg).toBe('RS256');
    expect(key.use).toBe('sig');
    expect(key.n).toBeDefined();
    expect(key.e).toBeDefined();

    // Verificación de seguridad: no debe exponer parámetros de clave privada
    expect(key.d).toBeUndefined();
    expect(key.p).toBeUndefined();
    expect(key.q).toBeUndefined();
    expect(key.dp).toBeUndefined();
    expect(key.dq).toBeUndefined();
    expect(key.qi).toBeUndefined();
  });
});
