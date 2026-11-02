import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import { AppModule } from '../src/app.module.js';
import { LoginService } from '../src/auth/login/login.service.js';

const getCookies = (res: request.Response): string[] => {
  const raw = res.headers['set-cookie'] as unknown;
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') return [raw];
  return [];
};

describe('OIDC Interactions & SSO (e2e)', () => {
  let app: INestApplication;
  let loginService: LoginService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    await app.init();

    loginService = moduleFixture.get<LoginService>(LoginService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('redirecciona a /interaction/:uid cuando no existe sesión SSO previa', async () => {
    const authRes = await request(app.getHttpServer())
      .get('/oidc/auth')
      .query({
        client_id: 'api-gateway',
        response_type: 'code',
        scope: 'openid',
        redirect_uri: 'http://localhost:3000/auth/callback',
        code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        code_challenge_method: 'S256',
      })
      .expect(303)
      .expect('Location', /\/interaction\/[a-zA-Z0-9_-]+/);

    const redirectUrl = authRes.headers.location as string;
    const uid = redirectUrl.split('/interaction/')[1];
    expect(uid).toBeDefined();

    // Consultar el formulario de interacción
    const formRes = await request(app.getHttpServer())
      .get(`/interaction/${uid}`)
      .set('Cookie', getCookies(authRes))
      .expect(200);

    expect(formRes.text).toContain('Iniciar Sesión');
    expect(formRes.text).toContain(`action="/interaction/${uid}/login"`);
  });

  it('rechaza login con 401 si las credenciales son inválidas', async () => {
    vi.spyOn(loginService, 'validateCredentials').mockResolvedValue(null);

    const authRes = await request(app.getHttpServer())
      .get('/oidc/auth')
      .query({
        client_id: 'api-gateway',
        response_type: 'code',
        scope: 'openid',
        redirect_uri: 'http://localhost:3000/auth/callback',
        code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        code_challenge_method: 'S256',
      })
      .expect(303);

    const uid = (authRes.headers.location as string).split('/interaction/')[1];

    await request(app.getHttpServer())
      .post(`/interaction/${uid}/login`)
      .set('Cookie', getCookies(authRes))
      .set('Accept', 'application/json')
      .send({
        identifier: 'wrong@test.com',
        password: 'badpassword',
      })
      .expect(401);
  });

  it('completa la interacción y redirige a la aplicación cuando las credenciales son válidas', async () => {
    vi.spyOn(loginService, 'validateCredentials').mockResolvedValue('user-uuid-12345');

    const authRes = await request(app.getHttpServer())
      .get('/oidc/auth')
      .query({
        client_id: 'api-gateway',
        response_type: 'code',
        scope: 'openid',
        redirect_uri: 'http://localhost:3000/auth/callback',
        code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        code_challenge_method: 'S256',
      })
      .expect(303);

    const uid = (authRes.headers.location as string).split('/interaction/')[1];
    const cookies = getCookies(authRes);

    const loginRes = await request(app.getHttpServer())
      .post(`/interaction/${uid}/login`)
      .set('Cookie', cookies)
      .send({
        identifier: 'valid@test.com',
        password: 'correctpassword',
      })
      .expect(303);

    // Tras finalizar la interacción, oidc-provider redirige de vuelta a /oidc/auth
    expect(loginRes.headers.location).toContain('/oidc/auth/');
  });
});
