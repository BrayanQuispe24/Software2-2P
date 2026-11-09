import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Param,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type Provider from 'oidc-provider';
import { InjectOidcProvider } from 'nest-oidc-provider';
import { LoginService } from '../../auth/login/login.service.js';
import { UsersService } from '../../users/users.service.js';

@Controller('interaction')
export class OidcInteractionController {
  constructor(
    @InjectOidcProvider() private readonly provider: Provider,
    private readonly loginService: LoginService,
    private readonly usersService: UsersService,
  ) {
    // Activa el modo proxy en la instancia de oidc-provider (Koa context)
    // para que reconozca los encabezados X-Forwarded-Proto y X-Forwarded-Host
    this.provider.proxy = true;
  }

  @Get(':uid')
  async getInteraction(
    @Param('uid') uid: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const details = await this.provider.interactionDetails(req, res);
      const { prompt, params } = details;

      if (prompt.name === 'login') {
        const clientName = (params.client_id as string) ?? 'Aplicación';
        return res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Inicio de Sesión SSO</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #242E35;
                color: #EBF4DD;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 1rem;
                box-sizing: border-box;
              }
              .card {
                background: #3B4953;
                border-radius: 14px;
                padding: 2.5rem;
                width: 100%;
                max-width: 420px;
                box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(144, 171, 139, 0.25);
              }
              h1 {
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
                font-weight: 700;
                color: #EBF4DD;
                text-align: center;
              }
              p.subtitle {
                margin: 0 0 2rem 0;
                font-size: 0.875rem;
                color: #90AB8B;
                text-align: center;
              }
              .form-group {
                margin-bottom: 1.25rem;
              }
              label {
                display: block;
                font-size: 0.875rem;
                font-weight: 500;
                margin-bottom: 0.5rem;
                color: #EBF4DD;
              }
              input {
                width: 100%;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                border: 1px solid #5A7863;
                background: #2A363E;
                color: #EBF4DD;
                font-size: 0.95rem;
                box-sizing: border-box;
                outline: none;
                transition: border-color 0.2s, box-shadow 0.2s;
              }
              input:focus {
                border-color: #90AB8B;
                box-shadow: 0 0 0 2px rgba(144, 171, 139, 0.25);
              }
              button {
                width: 100%;
                padding: 0.75rem 1rem;
                background: #5A7863;
                color: #EBF4DD;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                margin-top: 1rem;
                box-shadow: 0 4px 12px rgba(90, 120, 99, 0.3);
              }
              button:hover {
                background: #4a6652;
                transform: translateY(-1px);
              }
              .footer {
                margin-top: 1.5rem;
                text-align: center;
                font-size: 0.75rem;
                color: #90AB8B;
                opacity: 0.8;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Iniciar Sesión</h1>
              <p class="subtitle">Accede a <strong>${clientName}</strong> con tu cuenta</p>
              <form method="POST" action="/interaction/${uid}/login" onsubmit="const b = document.getElementById('submitBtn'); if (b) { b.disabled = true; b.innerText = 'Iniciando sesión...'; }">
                <div class="form-group">
                  <label for="identifier">Correo electrónico, Código o CI</label>
                  <input type="text" id="identifier" name="identifier" required placeholder="usuario@ejemplo.com" autofocus autocomplete="username" />
                </div>
                <div class="form-group">
                  <label for="password">Contraseña</label>
                  <input type="password" id="password" name="password" required placeholder="••••••••" autocomplete="current-password" />
                </div>
                <button type="submit" id="submitBtn">Continuar</button>
              </form>
              <div style="margin-top: 1.5rem; text-align: center; border-top: 1px solid rgba(144, 171, 139, 0.25); padding-top: 1rem;">
                <p style="color: #90AB8B; font-size: 0.85rem; margin-bottom: 0.5rem;">¿Eres cliente nuevo?</p>
                <a href="/interaction/${uid}/register" style="color: #90AB8B; font-weight: 600; text-decoration: none; font-size: 0.9rem;">Crear cuenta de cliente &rarr;</a>
              </div>
              <div class="footer">Servidor de Autenticación SSO</div>
            </div>
          </body>
          </html>
        `);
      }

      if (prompt.name === 'consent') {
        let grant: any;
        const grantId = details.grantId;
        if (grantId) {
          grant = await (this.provider as any).Grant.find(grantId);
        }
        if (!grant) {
          grant = new (this.provider as any).Grant({
            accountId: details.session?.accountId,
            clientId: params.client_id as string,
          });
        }

        const promptDetails = details.prompt.details as Record<string, any> | undefined;
        if (promptDetails?.missingOIDCScope) {
          grant.addOIDCScope((promptDetails.missingOIDCScope as string[]).join(' '));
        }
        if (promptDetails?.missingOIDCClaims) {
          grant.addOIDCClaims(promptDetails.missingOIDCClaims as string[]);
        }
        if (promptDetails?.missingResourceScopes) {
          for (const [indicator, scopes] of Object.entries(promptDetails.missingResourceScopes)) {
            grant.addResourceScope(indicator, (scopes as string[]).join(' '));
          }
        }

        const savedGrantId = await grant.save();
        const consent = { grantId: savedGrantId };

        return await this.provider.interactionFinished(
          req,
          res,
          { consent },
          { mergeWithLastSubmission: true },
        );
      }

      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 'unsupported_prompt',
        prompt: prompt.name,
      });
    } catch (error) {
      console.error('[getInteraction ERROR]', error);
      if (req.accepts('html')) {
        return res.status(HttpStatus.BAD_REQUEST).send(this.renderExpiredHtml());
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'interaction_error',
        message: error instanceof Error ? error.message : 'Error al procesar interacción',
      });
    }
  }

  @Post(':uid/login')
  async postLogin(
    @Param('uid') uid: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const details = await this.provider.interactionDetails(req, res);

      if (details.prompt.name !== 'login') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'invalid_interaction',
          message: 'Esta interacción no requiere autenticación.',
        });
      }

      const { identifier, email, password } = req.body ?? {};
      const loginTerm = identifier || email;

      if (typeof loginTerm !== 'string' || typeof password !== 'string') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'invalid_request',
          message: 'Debe ingresar identificador y contraseña válidos.',
        });
      }

      const accountId = await this.loginService.validateCredentials(
        loginTerm,
        password,
      );

      if (!accountId) {
        if (req.accepts('html')) {
          return res.status(HttpStatus.UNAUTHORIZED).send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <title>Error de Autenticación</title>
              <style>
                body { font-family: sans-serif; background: #242E35; color: #EBF4DD; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #3B4953; padding: 2rem; border-radius: 12px; text-align: center; max-width: 360px; border: 1px solid #ef4444; }
                h2 { color: #fca5a5; margin-top: 0; }
                p { color: #EBF4DD; }
                a { color: #90AB8B; text-decoration: none; display: inline-block; margin-top: 1rem; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>Credenciales incorrectas</h2>
                <p>El identificador o la contraseña no son correctos, o la cuenta está inactiva.</p>
                <a href="/interaction/${uid}">Intentar nuevamente</a>
              </div>
            </body>
            </html>
          `);
        }

        return res.status(HttpStatus.UNAUTHORIZED).json({
          error: 'invalid_credentials',
          message: 'Credenciales inválidas o cuenta inactiva.',
        });
      }

      return await this.provider.interactionFinished(
        req,
        res,
        {
          login: { accountId },
        },
        {
          mergeWithLastSubmission: false,
        },
      );
    } catch (error) {
      console.error('[postLogin ERROR]', error);
      if (req.accepts('html')) {
        return res.status(HttpStatus.BAD_REQUEST).send(this.renderExpiredHtml());
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'login_error',
        message: error instanceof Error ? error.message : 'Error durante el login',
      });
    }
  }

  private renderExpiredHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sesión Expirada - SSO</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #242E35; color: #EBF4DD; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 1rem; }
          .card { background: #3B4953; padding: 2.2rem; border-radius: 14px; text-align: center; max-width: 420px; border: 1px solid rgba(239, 68, 68, 0.4); box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
          h2 { color: #fca5a5; margin-top: 0; font-size: 1.4rem; }
          p { color: #cbd5e1; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }
          a.btn { background: #5A7863; color: #EBF4DD; text-decoration: none; display: inline-block; padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; transition: background 0.2s; box-shadow: 0 4px 12px rgba(90, 120, 99, 0.3); }
          a.btn:hover { background: #4a6652; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Sesión Expirada o Inválida</h2>
          <p>La sesión de autenticación ha expirado, ya fue utilizada o la ventana estuvo abierta por mucho tiempo.</p>
          <a href="http://localhost:5173/login" class="btn">Iniciar Sesión Nuevamente</a>
        </div>
      </body>
      </html>
    `;
  }

  @Get(':uid/register')
  async getRegister(
    @Param('uid') uid: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const details = await this.provider.interactionDetails(req, res);
      const clientName = (details.params.client_id as string) ?? 'Aplicación';
      return res.send(this.renderRegisterHtml(uid, clientName));
    } catch {
      return res.redirect(`/interaction/${uid}`);
    }
  }

  @Post(':uid/register')
  async postRegister(
    @Param('uid') uid: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let clientName = 'Aplicación';
    try {
      const details = await this.provider.interactionDetails(req, res);
      clientName = (details.params.client_id as string) ?? 'Aplicación';
    } catch {
      // continuar
    }

    const { nombre, apellido, ci, celular, email, password, aceptaTerminos } = req.body ?? {};

    if (!nombre || !apellido || !ci || !celular || !email || !password) {
      return res.status(HttpStatus.BAD_REQUEST).send(
        this.renderRegisterHtml(uid, clientName, 'Todos los campos marcados con asterisco son obligatorios.', req.body),
      );
    }

    try {
      const user = await this.usersService.registerClient({
        nombre: String(nombre).trim(),
        apellido: String(apellido).trim(),
        ci: String(ci).trim(),
        celular: String(celular).trim(),
        email: String(email).trim().toLowerCase(),
        password: String(password),
        aceptaTerminos: aceptaTerminos === 'on' || aceptaTerminos === true || aceptaTerminos === 'true',
      });

      // Auto-login automático en la sesión OIDC
      return await this.provider.interactionFinished(
        req,
        res,
        {
          login: { accountId: user.id },
        },
        {
          mergeWithLastSubmission: false,
        },
      );
    } catch (error: any) {
      const errorMsg = error?.response?.message || error?.message || 'Error al registrar el cliente.';
      return res.status(HttpStatus.CONFLICT).send(
        this.renderRegisterHtml(uid, clientName, errorMsg, req.body),
      );
    }
  }

  private renderRegisterHtml(
    uid: string,
    clientName: string,
    error?: string,
    values?: Record<string, string>,
  ): string {
    const v = values || {};
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registro de Cliente - SSO</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #242E35;
            color: #EBF4DD;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 1.5rem 1rem;
            box-sizing: border-box;
          }
          .card {
            background: #3B4953;
            border-radius: 14px;
            padding: 2.25rem;
            width: 100%;
            max-width: 500px;
            box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(144, 171, 139, 0.25);
          }
          h1 {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
            font-weight: 700;
            color: #EBF4DD;
            text-align: center;
          }
          p.subtitle {
            margin: 0 0 1.5rem 0;
            font-size: 0.875rem;
            color: #90AB8B;
            text-align: center;
          }
          .alert-error {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid #ef4444;
            color: #fca5a5;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.85rem;
            margin-bottom: 1.25rem;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          label {
            display: block;
            font-size: 0.8rem;
            font-weight: 500;
            margin-bottom: 0.35rem;
            color: #EBF4DD;
          }
          input[type="text"],
          input[type="email"],
          input[type="password"] {
            width: 100%;
            padding: 0.65rem 0.85rem;
            border-radius: 8px;
            border: 1px solid #5A7863;
            background: #2A363E;
            color: #EBF4DD;
            font-size: 0.9rem;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          input:focus {
            border-color: #90AB8B;
            box-shadow: 0 0 0 2px rgba(144, 171, 139, 0.25);
          }
          .checkbox-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 1.25rem 0;
            font-size: 0.85rem;
            color: #EBF4DD;
          }
          .checkbox-group input {
            width: 16px;
            height: 16px;
            accent-color: #5A7863;
            cursor: pointer;
          }
          button {
            width: 100%;
            padding: 0.8rem 1rem;
            background: #5A7863;
            color: #EBF4DD;
            border: none;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(90, 120, 99, 0.3);
          }
          button:hover {
            background: #4a6652;
            transform: translateY(-1px);
          }
          .footer-links {
            margin-top: 1.5rem;
            text-align: center;
            border-top: 1px solid rgba(144, 171, 139, 0.25);
            padding-top: 1rem;
            font-size: 0.85rem;
          }
          .footer-links a {
            color: #90AB8B;
            text-decoration: none;
            font-weight: 600;
          }
          .footer-links a:hover {
            color: #EBF4DD;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Crear Cuenta de Cliente</h1>
          <p class="subtitle">Regístrate para acceder a <strong>${clientName}</strong> vía SSO</p>

          ${error ? `<div class="alert-error">${error}</div>` : ''}

          <form method="POST" action="/interaction/${uid}/register">
            <div class="grid-2">
              <div class="form-group">
                <label for="nombre">Nombre *</label>
                <input type="text" id="nombre" name="nombre" required placeholder="Carlos" value="${v.nombre || ''}" autofocus />
              </div>
              <div class="form-group">
                <label for="apellido">Apellido *</label>
                <input type="text" id="apellido" name="apellido" required placeholder="Gutiérrez" value="${v.apellido || ''}" />
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label for="ci">C.I. *</label>
                <input type="text" id="ci" name="ci" required placeholder="12345678" value="${v.ci || ''}" />
              </div>
              <div class="form-group">
                <label for="celular">Celular *</label>
                <input type="text" id="celular" name="celular" required placeholder="71234567" value="${v.celular || ''}" />
              </div>
            </div>

            <div class="form-group">
              <label for="email">Correo electrónico *</label>
              <input type="email" id="email" name="email" required placeholder="cliente@ejemplo.com" value="${v.email || ''}" autocomplete="email" />
            </div>

            <div class="form-group">
              <label for="password">Contraseña *</label>
              <input type="password" id="password" name="password" required minlength="8" placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
            </div>

            <div class="checkbox-group">
              <input type="checkbox" id="aceptaTerminos" name="aceptaTerminos" checked required />
              <label for="aceptaTerminos" style="margin: 0; cursor: pointer;">
                Acepto los términos y condiciones del servicio
              </label>
            </div>

            <button type="submit">Crear cuenta e iniciar sesión</button>
          </form>

          <div class="footer-links">
            <span style="color: #94a3b8;">¿Ya tienes una cuenta?</span>
            <a href="/interaction/${uid}">Iniciar sesión</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
