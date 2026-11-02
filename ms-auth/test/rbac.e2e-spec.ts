import { describe, it, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  UseGuards,
  Controller,
  Post,
  Get,
} from '@nestjs/common';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { createLocalJWKSet, importJWK, SignJWT } from 'jose';
import { JwtVerifierService } from '../src/security/jwt-verifier.service.js';
import { PermissionsGuard } from '../src/auth/rbac/guards/permissions.guard.js';
import { Permissions } from '../src/auth/rbac/decorators/permissions.decorator.js';
import { Permission } from '../src/auth/rbac/enums/permission.enum.js';
import { Role } from '../src/auth/rbac/enums/role.enum.js';

@Injectable()
class TestJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtVerifier: JwtVerifierService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    const verified = await this.jwtVerifier.verify(token);
    req.user = verified;
    return true;
  }
}

@Controller('test-rbac')
@UseGuards(TestJwtAuthGuard, PermissionsGuard)
class TestRbacController {
  @Post('usuarios')
  @Permissions(Permission.USERS_CREATE)
  createUsuario() {
    return { ok: true, resource: 'usuarios' };
  }

  @Get('inscripciones')
  @Permissions(Permission.ENROLLMENTS_MANAGE)
  manageInscripciones() {
    return { ok: true, resource: 'inscripciones' };
  }

  @Post('clases')
  @Permissions(Permission.CLASSES_MANAGE)
  manageClases() {
    return { ok: true, resource: 'clases' };
  }

  @Post('clases/inscribirse')
  @Permissions(Permission.CLASSES_ENROLL)
  enrollClase() {
    return { ok: true, resource: 'inscribirse' };
  }
}

describe('RBAC Guards & Permisos por Rol (e2e)', () => {
  let app: INestApplication;
  let privateKey: any;

  const issuer = 'http://localhost:4000/oidc';
  const audience = 'urn:app:api';

  const rolePermissions: Record<Role, string[]> = {
    [Role.ADMINISTRADOR]: [
      Permission.USERS_READ,
      Permission.USERS_CREATE,
      Permission.USERS_UPDATE,
      Permission.USERS_DELETE,
      Permission.ENROLLMENTS_READ,
      Permission.ENROLLMENTS_MANAGE,
      Permission.CLASSES_READ,
      Permission.CLASSES_MANAGE,
      Permission.CLASSES_ENROLL,
      Permission.PROFILE_READ,
    ],
    [Role.RECEPCIONISTA]: [
      Permission.USERS_READ,
      Permission.ENROLLMENTS_READ,
      Permission.ENROLLMENTS_MANAGE,
      Permission.CLASSES_READ,
      Permission.PROFILE_READ,
    ],
    [Role.INSTRUCTOR]: [
      Permission.CLASSES_READ,
      Permission.CLASSES_MANAGE,
      Permission.PROFILE_READ,
    ],
    [Role.CLIENTE]: [
      Permission.CLASSES_READ,
      Permission.CLASSES_ENROLL,
      Permission.PROFILE_READ,
    ],
  };

  const createTokenForRole = async (role: Role, userId = `user-${role.toLowerCase()}`) => {
    return await new SignJWT({
      roles: [role],
      permissions: rolePermissions[role],
      codigo: `${role.slice(0, 3)}-001`,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'd5afc989-6ec5-43d5-bb1a-bef0287557e5' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
  };

  beforeAll(async () => {
    const rawJwks = JSON.parse(readFileSync('keys/oidc-private.jwks.json', 'utf8'));
    privateKey = await importJWK(rawJwks.keys[0], 'RS256');

    const publicJwks = {
      keys: rawJwks.keys.map(
        ({ d: _d, p: _p, q: _q, dp: _dp, dq: _dq, qi: _qi, ...pub }: any) =>
          pub,
      ),
    };

    const jwtVerifier = new JwtVerifierService({
      issuer,
      audience,
      keyStore: createLocalJWKSet(publicJwks as any),
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestRbacController],
      providers: [
        {
          provide: JwtVerifierService,
          useValue: jwtVerifier,
        },
        TestJwtAuthGuard,
        PermissionsGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Control de acceso sin autenticación', () => {
    it('rechaza con 401 Unauthorized cuando no se envía cabecera Authorization', async () => {
      await request(app.getHttpServer())
        .post('/test-rbac/usuarios')
        .expect(401);
    });

    it('rechaza con 401 Unauthorized cuando el token es inválido o corrupto', async () => {
      await request(app.getHttpServer())
        .post('/test-rbac/usuarios')
        .set('Authorization', 'Bearer token-invalido-o-malformado')
        .expect(401);
    });
  });

  describe('Rol: ADMINISTRADOR', () => {
    it('tiene acceso a todos los recursos protegidos', async () => {
      const token = await createTokenForRole(Role.ADMINISTRADOR);

      await request(app.getHttpServer())
        .post('/test-rbac/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .expect(201, { ok: true, resource: 'usuarios' });

      await request(app.getHttpServer())
        .get('/test-rbac/inscripciones')
        .set('Authorization', `Bearer ${token}`)
        .expect(200, { ok: true, resource: 'inscripciones' });

      await request(app.getHttpServer())
        .post('/test-rbac/clases')
        .set('Authorization', `Bearer ${token}`)
        .expect(201, { ok: true, resource: 'clases' });

      await request(app.getHttpServer())
        .post('/test-rbac/clases/inscribirse')
        .set('Authorization', `Bearer ${token}`)
        .expect(201, { ok: true, resource: 'inscribirse' });
    });
  });

  describe('Rol: RECEPCIONISTA', () => {
    it('puede gestionar inscripciones pero tiene denegado crear usuarios y gestionar clases (403)', async () => {
      const token = await createTokenForRole(Role.RECEPCIONISTA);

      // Autorizado en inscripciones
      await request(app.getHttpServer())
        .get('/test-rbac/inscripciones')
        .set('Authorization', `Bearer ${token}`)
        .expect(200, { ok: true, resource: 'inscripciones' });

      // Denegado en crear usuarios
      await request(app.getHttpServer())
        .post('/test-rbac/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Denegado en gestionar clases
      await request(app.getHttpServer())
        .post('/test-rbac/clases')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Rol: INSTRUCTOR', () => {
    it('puede gestionar clases pero tiene denegado crear usuarios y gestionar inscripciones (403)', async () => {
      const token = await createTokenForRole(Role.INSTRUCTOR);

      // Autorizado en gestionar clases
      await request(app.getHttpServer())
        .post('/test-rbac/clases')
        .set('Authorization', `Bearer ${token}`)
        .expect(201, { ok: true, resource: 'clases' });

      // Denegado en crear usuarios
      await request(app.getHttpServer())
        .post('/test-rbac/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Denegado en gestionar inscripciones
      await request(app.getHttpServer())
        .get('/test-rbac/inscripciones')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Rol: CLIENTE', () => {
    it('puede inscribirse en clases pero tiene denegado crear usuarios, gestionar clases y gestionar inscripciones (403)', async () => {
      const token = await createTokenForRole(Role.CLIENTE);

      // Autorizado en inscribirse a clases
      await request(app.getHttpServer())
        .post('/test-rbac/clases/inscribirse')
        .set('Authorization', `Bearer ${token}`)
        .expect(201, { ok: true, resource: 'inscribirse' });

      // Denegado en crear usuarios
      await request(app.getHttpServer())
        .post('/test-rbac/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Denegado en gestionar clases
      await request(app.getHttpServer())
        .post('/test-rbac/clases')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Denegado en gestionar inscripciones
      await request(app.getHttpServer())
        .get('/test-rbac/inscripciones')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
