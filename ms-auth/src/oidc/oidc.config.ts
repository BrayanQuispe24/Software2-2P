import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Configuration } from 'oidc-provider';
import type { PrismaService } from '../prisma/prisma.service.js';

export function createFindAccount(prisma: PrismaService) {
  return async (_ctx: unknown, accountId: string) => {
    const user = await prisma.user.findFirst({
      where: {
        id: accountId,
        deletedAt: null,
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.estado !== 'ACTIVO') {
      return undefined;
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionSet = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.permissions) {
        permissionSet.add(rp.permission.name);
      }
    }
    const permissions = Array.from(permissionSet);

    return {
      accountId: String(user.id),
      async claims() {
        return {
          sub: String(user.id),
          email: user.email,
          name: `${user.nombre} ${user.apellido}`,
          codigo: user.codigo,
          tipoUsuario: user.tipoUsuario,
          roles,
          permissions,
        };
      },
    };
  };
}

export function createOidcConfig(prisma: PrismaService): Configuration {
  const keyPath = resolve(
    process.env.OIDC_JWKS_FILE ?? 'keys/oidc-private.jwks.json',
  );
  if (!existsSync(keyPath)) {
    throw new Error(
      `[MS-AUTH] No se encontró el archivo de claves JWKS en: '${keyPath}'. ` +
        `Ejecuta 'node scripts/generate-oidc-keys.mjs' o configura OIDC_JWKS_FILE.`,
    );
  }
  const jwks = JSON.parse(readFileSync(keyPath, 'utf8'));

  return {
    conformIdTokenClaims: false,
    clients: [
      {
        client_id: 'api-gateway',
        client_name: 'API Gateway',
        client_secret:
          process.env.OIDC_GATEWAY_SECRET ??
          '9f8e4c7b2a1d0f5e8c3b6a9d2e4f7a1c5b8e0d3f6a9c2e5b8d1f4a7c0e3b6d9f',
        redirect_uris: ['http://localhost:3000/auth/callback'],
        post_logout_redirect_uris: [
          'http://localhost:3000/',
          'http://localhost:5173/login',
          'http://localhost:5173',
        ],
        response_types: ['code'],
        grant_types: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_method: 'client_secret_basic',
        scope: 'openid profile email offline_access api:read api:write',
      },
      {
        client_id: 'cliente-pruebas',
        client_name: 'Cliente de Pruebas OIDC',
        redirect_uris: ['http://127.0.0.1:3333/callback'],
        response_types: ['code'],
        grant_types: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_method: 'none',
        scope: 'openid profile email offline_access api:read api:write',
      },
      {
        client_id: 'cliente-sso-b',
        client_name: 'Segundo Cliente OIDC para SSO',
        redirect_uris: ['http://127.0.0.1:3334/callback'],
        response_types: ['code'],
        grant_types: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_method: 'none',
        scope: 'openid profile email offline_access api:read api:write',
      },
    ],
    jwks,
    scopes: ['openid', 'offline_access', 'api:read', 'api:write'],
    features: {
      devInteractions: { enabled: false },
      rpInitiatedLogout: {
        enabled: true,
        async logoutSource(ctx: any, form: string) {
          ctx.body = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cerrando sesión...</title>
  <style>
    body {
      background-color: #242E35;
      color: #EBF4DD;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(144, 171, 139, 0.25);
      border-top-color: #5A7863;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      const form = document.getElementById('op.logoutForm') || document.querySelector('form');
      if (form) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'logout';
        input.value = 'yes';
        form.appendChild(input);
        form.submit();
      }
    });
  </script>
</head>
<body>
  <div style="text-align: center;">
    <div class="spinner"></div>
    <p>Cerrando sesión global de forma segura...</p>
    ${form}
  </div>
</body>
</html>`;
        },
      },
      resourceIndicators: {
        enabled: true,
        async getResourceServerInfo(_ctx, resourceIndicator, client) {
          const allowedClients = ['api-gateway', 'cliente-pruebas', 'cliente-sso-b'];
          if (
            resourceIndicator !== 'urn:app:api' ||
            !allowedClients.includes(client.clientId)
          ) {
            const error: any = new Error('Recurso o cliente no autorizado');
            error.error = 'invalid_target';
            error.error_description =
              'El recurso solicitado no está autorizado para este cliente';
            throw error;
          }

          return {
            scope: 'api:read api:write',
            audience: 'urn:app:api',
            accessTokenTTL: 300, // 5 minutos
            accessTokenFormat: 'jwt',
            jwt: {
              sign: { alg: 'RS256' },
            },
          };
        },
      },
    },
    interactions: {
      url(_ctx, interaction) {
        return `/interaction/${interaction.uid}`;
      },
    },
    ttl: {
      AccessToken: 60 * 5,       // 5 minutos
      IdToken: 60 * 5,           // 5 minutos
      AuthorizationCode: 60,     // 1 minuto
      Interaction: 60 * 10,      // 10 minutos
      Session: 60 * 60 * 8,      // 8 horas
      RefreshToken: 60 * 60 * 24, // 24 horas
    },
    claims: {
      openid: ['sub'],
      email: ['email'],
      profile: ['name', 'codigo', 'tipoUsuario', 'roles', 'permissions'],
    },
    findAccount: createFindAccount(prisma),
    async extraTokenClaims(_ctx, token) {
      const accountId =
        'accountId' in token ? (token.accountId as string) : undefined;
      if (!accountId) {
        return undefined;
      }

      const user = await prisma.user.findFirst({
        where: {
          id: accountId,
          deletedAt: null,
        },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user || user.estado !== 'ACTIVO') {
        return undefined;
      }

      const roles = user.userRoles.map((ur) => ur.role.name);
      const permissionSet = new Set<string>();
      for (const ur of user.userRoles) {
        for (const rp of ur.role.permissions) {
          permissionSet.add(rp.permission.name);
        }
      }
      const permissions = Array.from(permissionSet);

      return {
        roles,
        permissions,
        codigo: user.codigo,
        tipoUsuario: user.tipoUsuario,
      };
    },
  };
}
