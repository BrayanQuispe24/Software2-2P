import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import { randomBytes, createHash } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { LoginService } from '../src/auth/login/login.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
const base64url = (buf: Buffer) => buf.toString('base64url');

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

describe('Single Sign-On (SSO) entre múltiples clientes (e2e)', () => {
  let app: INestApplication;
  let loginService: LoginService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-sso-uuid-test',
    email: 'docente@test.com',
    nombre: 'Profesor',
    apellido: 'X',
    codigo: 'INS-001',
    tipoUsuario: 'INSTRUCTOR',
    estado: 'ACTIVO',
    deletedAt: null,
    userRoles: [
      {
        role: {
          name: 'INSTRUCTOR',
          permissions: [
            { permission: { name: 'clases.gestionar' } },
            { permission: { name: 'asistencias.registrar' } },
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
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    await app.init();

    loginService = moduleFixture.get<LoginService>(LoginService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    vi.spyOn(loginService, 'validateCredentials').mockResolvedValue(mockUser.id);
    vi.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser as any);
  });

  afterEach(async () => {
    await app.close();
  });

  it(
    'permite que el Cliente B obtenga código de autorización sin pedir credenciales gracias a la sesión SSO del Cliente A',
    async () => {
      // ==========================================
      // PASO 1: Login en Cliente A (cliente-pruebas)
      // ==========================================
      const verifierA = base64url(randomBytes(32));
      const challengeA = createHash('sha256').update(verifierA).digest('base64url');

      const authResA = await request(app.getHttpServer())
        .get('/oidc/auth')
        .query({
          client_id: 'cliente-pruebas',
          response_type: 'code',
          scope: 'openid profile email api:read',
          redirect_uri: 'http://127.0.0.1:3333/callback',
          resource: 'urn:app:api',
          code_challenge: challengeA,
          code_challenge_method: 'S256',
        })
        .expect(303);

      const uidA = (authResA.headers.location as string).split('/interaction/')[1];
      const cookiesAuthA = getCookies(authResA);

      // Enviar credenciales
      const loginResA = await request(app.getHttpServer())
        .post(`/interaction/${uidA}/login`)
        .set('Cookie', cookiesAuthA)
        .send({
          identifier: 'docente@test.com',
          password: 'Password123!',
        })
        .expect(303);

      let currentLocationA = loginResA.headers.location as string;
      let ssoCookies = mergeCookies(cookiesAuthA, getCookies(loginResA));

      // Seguir redirecciones hasta llegar al callback del Cliente A
      while (currentLocationA && !currentLocationA.includes('3333/callback?code=')) {
        const urlObj = new URL(currentLocationA, 'http://localhost:4000');
        const nextRes = await request(app.getHttpServer())
          .get(urlObj.pathname + urlObj.search)
          .set('Cookie', ssoCookies)
          .expect(303);

        currentLocationA = nextRes.headers.location as string;
        ssoCookies = mergeCookies(ssoCookies, getCookies(nextRes));
      }

      expect(currentLocationA).toContain('http://127.0.0.1:3333/callback?code=');
      const codeA = new URL(currentLocationA).searchParams.get('code');
      expect(codeA).toBeTruthy();

      // Canjear tokens para Cliente A
      const tokenResA = await request(app.getHttpServer())
        .post('/oidc/token')
        .type('form')
        .send({
          grant_type: 'authorization_code',
          client_id: 'cliente-pruebas',
          code: codeA,
          redirect_uri: 'http://127.0.0.1:3333/callback',
          code_verifier: verifierA,
          resource: 'urn:app:api',
        })
        .expect(200);

      expect(tokenResA.body).toHaveProperty('access_token');
      expect(tokenResA.body).toHaveProperty('id_token');

      // ==========================================
      // PASO 2: Acceso desde Cliente B (cliente-sso-b) CON la cookie de sesión SSO
      // ==========================================
      const verifierB = base64url(randomBytes(32));
      const challengeB = createHash('sha256').update(verifierB).digest('base64url');

      const authResB = await request(app.getHttpServer())
        .get('/oidc/auth')
        .set('Cookie', ssoCookies)
        .query({
          client_id: 'cliente-sso-b',
          response_type: 'code',
          scope: 'openid profile email api:read',
          redirect_uri: 'http://127.0.0.1:3334/callback',
          resource: 'urn:app:api',
          code_challenge: challengeB,
          code_challenge_method: 'S256',
        })
        .expect(303);

      let currentLocationB = authResB.headers.location as string;
      let ssoCookiesB = mergeCookies(ssoCookies, getCookies(authResB));

      // Si hay paso de interacción, verificar que NO requiere login (puede ser sólo consent)
      while (currentLocationB && !currentLocationB.includes('3334/callback?code=')) {
        // Asegurarnos de que no nos redirige a una pantalla que exija login
        expect(currentLocationB).not.toContain('/login');

        const urlObj = new URL(currentLocationB, 'http://localhost:4000');
        const nextRes = await request(app.getHttpServer())
          .get(urlObj.pathname + urlObj.search)
          .set('Cookie', ssoCookiesB)
          .expect(303);

        currentLocationB = nextRes.headers.location as string;
        ssoCookiesB = mergeCookies(ssoCookiesB, getCookies(nextRes));
      }

      // Cliente B debe haber recibido el código sin haber pedido password nuevamente
      expect(currentLocationB).toContain('http://127.0.0.1:3334/callback?code=');
      const codeB = new URL(currentLocationB).searchParams.get('code');
      expect(codeB).toBeTruthy();
      expect(codeB).not.toBe(codeA);

      // Canjear tokens para Cliente B
      const tokenResB = await request(app.getHttpServer())
        .post('/oidc/token')
        .type('form')
        .send({
          grant_type: 'authorization_code',
          client_id: 'cliente-sso-b',
          code: codeB,
          redirect_uri: 'http://127.0.0.1:3334/callback',
          code_verifier: verifierB,
          resource: 'urn:app:api',
        })
        .expect(200);

      expect(tokenResB.body).toHaveProperty('access_token');
      expect(tokenResB.body).toHaveProperty('id_token');
    },
    20000,
  );

  it(
    'cierra la sesión SSO y exige volver a autenticarse en solicitudes posteriores',
    async () => {
      // 1. Login inicial en Cliente A
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
      const cookiesAuth = getCookies(authRes);

      const loginRes = await request(app.getHttpServer())
        .post(`/interaction/${uid}/login`)
        .set('Cookie', cookiesAuth)
        .send({
          identifier: 'docente@test.com',
          password: 'Password123!',
        })
        .expect(303);

      let currentLocation = loginRes.headers.location as string;
      let ssoCookies = mergeCookies(cookiesAuth, getCookies(loginRes));

      while (currentLocation && !currentLocation.includes('3333/callback?code=')) {
        const urlObj = new URL(currentLocation, 'http://localhost:4000');
        const nextRes = await request(app.getHttpServer())
          .get(urlObj.pathname + urlObj.search)
          .set('Cookie', ssoCookies)
          .expect(303);

        currentLocation = nextRes.headers.location as string;
        ssoCookies = mergeCookies(ssoCookies, getCookies(nextRes));
      }

      expect(currentLocation).toContain('http://127.0.0.1:3333/callback?code=');

      // 2. Iniciar y confirmar cierre de sesión (logout) en /oidc/session/end
      const endSessionRes = await request(app.getHttpServer())
        .get('/oidc/session/end')
        .set('Cookie', ssoCookies)
        .expect(200);

      const xsrf = endSessionRes.text.match(/name="xsrf" value="([^"]+)"/)?.[1];
      expect(xsrf).toBeTruthy();

      const confirmCookies = mergeCookies(ssoCookies, getCookies(endSessionRes));

      const confirmRes = await request(app.getHttpServer())
        .post('/oidc/session/end/confirm')
        .set('Cookie', confirmCookies)
        .type('form')
        .send({
          xsrf,
          logout: 'yes',
        });

      const loggedOutCookies = mergeCookies(confirmCookies, getCookies(confirmRes));

      // 3. Nueva solicitud sin las cookies previas o tras invocar logout debe requerir login
      const newVerifier = base64url(randomBytes(32));
      const newChallenge = createHash('sha256').update(newVerifier).digest('base64url');

      const subsequentAuthRes = await request(app.getHttpServer())
        .get('/oidc/auth')
        .set('Cookie', loggedOutCookies)
        .query({
          client_id: 'cliente-pruebas',
          response_type: 'code',
          scope: 'openid',
          redirect_uri: 'http://127.0.0.1:3333/callback',
          code_challenge: newChallenge,
          code_challenge_method: 'S256',
        })
        .expect(303);

      // Debe redirigir de nuevo a /interaction/:uid para autenticación
      expect(subsequentAuthRes.headers.location).toContain('/interaction/');
    },
    20000,
  );
});

