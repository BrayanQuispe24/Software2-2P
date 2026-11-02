import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import { randomBytes, createHash } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { LoginService } from '../src/auth/login/login.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { JwtVerifierService } from '../src/security/jwt-verifier.service.js';

import { readFileSync } from 'node:fs';
import { createLocalJWKSet } from 'jose';

const getCookies = (res: request.Response): string[] => {
  const raw = res.headers['set-cookie'] as unknown;
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') return [raw];
  return [];
};

const mergeCookies = (oldCookies: string[], newCookies: string[]): string[] => {
  const cookieMap = new Map<string, string>();
  for (const c of [...oldCookies, ...newCookies]) {
    const parts = c.split(';')[0];
    const [name, ...val] = parts.split('=');
    if (name) {
      cookieMap.set(name.trim(), `${name.trim()}=${val.join('=')}`);
    }
  }
  return Array.from(cookieMap.values());
};

const base64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64url');

describe('OAuth 2.0 Token Exchange & JWT Validation (e2e)', () => {
  let app: INestApplication;
  let loginService: LoginService;
  let prismaService: PrismaService;
  let jwtVerifier: JwtVerifierService;

  const mockUser = {
    id: 'user-uuid-token-test',
    codigo: 'ADM-001',
    nombre: 'Admin',
    apellido: 'SSO',
    estado: 'ACTIVO',
    email: 'admin@test.com',
    passwordHash: 'hash',
    deletedAt: null,
    tipoUsuario: 'ADMIN',
    userRoles: [
      {
        role: {
          name: 'ADMINISTRADOR',
          permissions: [
            { permission: { name: 'usuarios.leer' } },
            { permission: { name: 'usuarios.crear' } },
          ],
        },
      },
    ],
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    await app.init();

    loginService = moduleFixture.get<LoginService>(LoginService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Inicializar el verificador con la clave pública local para no depender de llamadas HTTP externas
    const rawJwks = JSON.parse(readFileSync('keys/oidc-private.jwks.json', 'utf8'));
    const publicJwks = {
      keys: rawJwks.keys.map(
        ({ d: _d, p: _p, q: _q, dp: _dp, dq: _dq, qi: _qi, ...pub }: any) =>
          pub,
      ),
    };
    jwtVerifier = new JwtVerifierService({
      issuer: 'http://localhost:4000/oidc',
      audience: 'urn:app:api',
      keyStore: createLocalJWKSet(publicJwks as any),
    });

    vi.spyOn(loginService, 'validateCredentials').mockResolvedValue(mockUser.id);
    vi.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser as any);
  });

  afterEach(async () => {
    await app.close();
  });

  it(
    'ejecuta el flujo completo de Authorization Code + PKCE, emite Access Token JWT con claims RBAC y rechaza el reuso de código',
    async () => {
    // 1. Generar PKCE verifier y challenge
    const verifier = base64url(randomBytes(32));
    const challenge = createHash('sha256').update(verifier).digest('base64url');

    // 2. Iniciar flujo de autorización
    const authRes = await request(app.getHttpServer())
      .get('/oidc/auth')
      .query({
        client_id: 'cliente-pruebas',
        response_type: 'code',
        scope: 'openid profile email api:read api:write',
        redirect_uri: 'http://127.0.0.1:3333/callback',
        resource: 'urn:app:api',
        code_challenge: challenge,
        code_challenge_method: 'S256',
      })
      .expect(303);

    const uid = (authRes.headers.location as string).split('/interaction/')[1];
    const cookies = getCookies(authRes);

    // 3. Completar login en la interacción
    const loginRes = await request(app.getHttpServer())
      .post(`/interaction/${uid}/login`)
      .set('Cookie', cookies)
      .send({
        identifier: 'admin@test.com',
        password: 'Password123!',
      })
      .expect(303);

    let currentLocation = loginRes.headers.location as string;
    let authCookies = mergeCookies(cookies, getCookies(loginRes));

    while (currentLocation && !currentLocation.includes('callback?code=')) {
      const urlObj = new URL(currentLocation, 'http://localhost:4000');
      const nextRes = await request(app.getHttpServer())
        .get(urlObj.pathname + urlObj.search)
        .set('Cookie', authCookies)
        .expect(303);

      currentLocation = nextRes.headers.location as string;
      authCookies = mergeCookies(authCookies, getCookies(nextRes));
    }

    expect(currentLocation).toContain('http://127.0.0.1:3333/callback?code=');

    const callbackUrl = new URL(currentLocation);
    const code = callbackUrl.searchParams.get('code');
    expect(code).toBeTruthy();

    // 5. Intercambiar el código por tokens en /oidc/token
    const tokenRes = await request(app.getHttpServer())
      .post('/oidc/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        client_id: 'cliente-pruebas',
        code,
        redirect_uri: 'http://127.0.0.1:3333/callback',
        code_verifier: verifier,
        resource: 'urn:app:api',
      })
      .expect(200);

    expect(tokenRes.body).toHaveProperty('access_token');
    expect(tokenRes.body).toHaveProperty('id_token');
    expect(tokenRes.body).toHaveProperty('token_type', 'Bearer');
    expect(tokenRes.body).toHaveProperty('expires_in', 300);

    const accessToken = tokenRes.body.access_token as string;
    // Comprobar que el Access Token es un JWT de 3 partes
    expect(accessToken.split('.')).toHaveLength(3);

    // 6. Validar criptográficamente el JWT emitido con JwtVerifierService
    const verified = await jwtVerifier.verify(accessToken);
    expect(verified.userId).toBe(mockUser.id);
    expect(verified.roles).toContain('ADMINISTRADOR');
    expect(verified.permissions).toContain('usuarios.leer');
    expect(verified.permissions).toContain('usuarios.crear');
    expect(verified.claims.aud).toBe('urn:app:api');
    expect(verified.claims.iss).toBe('http://localhost:4000/oidc');

    // 7. Prueba de seguridad: Rechazo de código reutilizado
    const reuseRes = await request(app.getHttpServer())
      .post('/oidc/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        client_id: 'cliente-pruebas',
        code,
        redirect_uri: 'http://127.0.0.1:3333/callback',
        code_verifier: verifier,
      })
      .expect(400);

    expect(reuseRes.body.error).toBe('invalid_grant');
    },
    30000,
  );

  it(
    'rechaza el canje si el code_verifier no coincide con el code_challenge',
    async () => {
      const verifier = base64url(randomBytes(32));
      const challenge = createHash('sha256').update(verifier).digest('base64url');

      const authRes = await request(app.getHttpServer())
        .get('/oidc/auth')
        .query({
          client_id: 'cliente-pruebas',
          response_type: 'code',
          scope: 'openid',
          redirect_uri: 'http://127.0.0.1:3333/callback',
          code_challenge: challenge,
          code_challenge_method: 'S256',
        })
        .expect(303);

      const uid = (authRes.headers.location as string).split('/interaction/')[1];
      const cookies = getCookies(authRes);

      const loginRes = await request(app.getHttpServer())
        .post(`/interaction/${uid}/login`)
        .set('Cookie', cookies)
        .send({
          identifier: 'admin@test.com',
          password: 'Password123!',
        })
        .expect(303);

      let currentLocation = loginRes.headers.location as string;
      let authCookies = mergeCookies(cookies, getCookies(loginRes));

      while (currentLocation && !currentLocation.includes('callback?code=')) {
        const urlObj = new URL(currentLocation, 'http://localhost:4000');
        const nextRes = await request(app.getHttpServer())
          .get(urlObj.pathname + urlObj.search)
          .set('Cookie', authCookies)
          .expect(303);

        currentLocation = nextRes.headers.location as string;
        authCookies = mergeCookies(authCookies, getCookies(nextRes));
      }

      const code = new URL(currentLocation).searchParams.get('code');

      // Enviar con un code_verifier incorrecto
      const badTokenRes = await request(app.getHttpServer())
        .post('/oidc/token')
        .type('form')
        .send({
          grant_type: 'authorization_code',
          client_id: 'cliente-pruebas',
          code,
          redirect_uri: 'http://127.0.0.1:3333/callback',
          code_verifier: 'invalid-code-verifier-that-does-not-match',
        })
        .expect(400);

      expect(['invalid_grant', 'invalid_request']).toContain(
        badTokenRes.body.error,
      );
    },
    30000,
  );
});
