import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ConfigService } from '@nestjs/config';
import { decodeJwt } from 'jose';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) { }

  @Get('login')
  async login(@Req() req: Request, @Res() res: Response) {
    const auth = await this.authService.createAuthorizationRequest();

    req.session.oidcPending = {
      state: auth.state,
      nonce: auth.nonce,
      codeVerifier: auth.codeVerifier,
    };

    console.log(`[LOGIN] SID=${req.sessionID} CookiesIn=${req.headers.cookie ?? 'none'} state=${auth.state}`);

    req.session.save((error) => {
      if (error) {
        console.error('[LOGIN] Error saving session:', error);
        throw new InternalServerErrorException('Error al guardar sesión de autorización');
      }
      return res.redirect(auth.url);
    });
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    console.log(`[CALLBACK] SID=${req.sessionID} CookiesIn=${req.headers.cookie ?? 'none'} HasPending=${Boolean(req.session.oidcPending)} Url=${req.originalUrl}`);
    const pending = req.session.oidcPending;
    if (!pending) {
      console.warn(`[CALLBACK 401] No oidcPending found for session ${req.sessionID}. Redirigiendo al login del frontend.`);
      const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
      return res.redirect(`${frontendUrl}/login?reason=session_expired`);
    }

    delete req.session.oidcPending;

    const port = this.config.get('PORT', 3000);
    const configuredRedirectUri = this.config.get<string>('OIDC_REDIRECT_URI');
    let callbackUrl: URL;
    if (configuredRedirectUri) {
      callbackUrl = new URL(configuredRedirectUri);
      const incoming = new URL(req.originalUrl, 'http://localhost');
      incoming.searchParams.forEach((val, key) => {
        callbackUrl.searchParams.set(key, val);
      });
    } else {
      callbackUrl = new URL(req.originalUrl, `http://localhost:${port}`);
    }

    let tokens;
    try {
      tokens = await this.authService.exchangeCode(
        callbackUrl,
        pending.codeVerifier,
        pending.state,
        pending.nonce,
      );
    } catch (err: any) {
      console.error('[CALLBACK exchangeCode ERROR]', err?.message || err);
      throw err;
    }

    const claims = tokens.claims();
    if (!claims?.sub) {
      throw new UnauthorizedException('No se pudo verificar la identidad del token OIDC');
    }

    let accessClaims: Record<string, unknown> = {};
    if (tokens.access_token) {
      try {
        accessClaims = decodeJwt(tokens.access_token);
      } catch {
        // En caso de que no sea formato JWT decodificable
      }
    }

    const roles = (Array.isArray(accessClaims.roles) && accessClaims.roles.length > 0)
      ? (accessClaims.roles as string[])
      : (Array.isArray(claims.roles) && claims.roles.length > 0)
        ? (claims.roles as string[])
        : [];

    const permissions = (Array.isArray(accessClaims.permissions) && accessClaims.permissions.length > 0)
      ? (accessClaims.permissions as string[])
      : (Array.isArray(claims.permissions) && claims.permissions.length > 0)
        ? (claims.permissions as string[])
        : [];

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    req.session.user = {
      sub: claims.sub,
      email: typeof claims.email === 'string' ? claims.email : undefined,
      name: typeof claims.name === 'string' ? claims.name : undefined,
      codigo: typeof accessClaims.codigo === 'string' ? accessClaims.codigo : undefined,
      tipoUsuario: typeof accessClaims.tipoUsuario === 'string' ? accessClaims.tipoUsuario : undefined,
      roles,
      permissions,
    };

    req.session.accessToken = tokens.access_token;
    req.session.idToken = tokens.id_token;
    if (tokens.refresh_token) {
      req.session.refreshToken = tokens.refresh_token;
    }
    req.session.expiresAt = Date.now() + (tokens.expires_in ?? 300) * 1000;

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    return res.redirect(`${frontendUrl}/dashboard`);
  }

  @Get('me')
  getProfile(@Req() req: Request) {
    if (!req.session.user) {
      throw new UnauthorizedException('No hay sesión autenticada');
    }

    return {
      authenticated: true,
      user: req.session.user,
      expiresAt: req.session.expiresAt,
    };
  }

  @Get('logout')
  async logoutGet(@Req() req: Request, @Res() res: Response) {
    const idToken = req.session.idToken;
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const postLogoutRedirect = `${frontendUrl}/login`;

    let logoutUrl = `${frontendUrl}/login`;
    try {
      logoutUrl = this.authService.buildLogoutUrl(idToken, postLogoutRedirect);
    } catch (e) {
      console.warn('No se pudo generar URL OIDC de logout:', e);
    }

    const cookieSecure = this.config.get('COOKIE_SECURE') === 'true';
    req.session.destroy(() => {
      res.clearCookie('gateway.sid', { path: '/', httpOnly: true, secure: cookieSecure, sameSite: 'lax' });
      return res.redirect(logoutUrl);
    });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    console.log(`[LOGOUT POST] SID=${req.sessionID} CookiesIn=${req.headers.cookie ?? 'none'} idToken=${Boolean(req.session?.idToken)}`);
    const idToken = req.session?.idToken;
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const postLogoutRedirect = `${frontendUrl}/login`;

    let logoutUrl = `${frontendUrl}/login`;
    try {
      logoutUrl = this.authService.buildLogoutUrl(idToken, postLogoutRedirect);
    } catch (e) {
      console.warn('No se pudo generar URL OIDC de logout:', e);
    }
    console.log(`[LOGOUT POST] Generated logoutUrl: ${logoutUrl}`);

    const cookieSecure = this.config.get('COOKIE_SECURE') === 'true';
    req.session.destroy((error) => {
      if (error) {
        console.error('[LOGOUT POST] Error destroying session:', error);
        throw new InternalServerErrorException('No se pudo cerrar la sesión');
      }
      res.clearCookie('gateway.sid', { path: '/', httpOnly: true, secure: cookieSecure, sameSite: 'lax' });
      return res.status(200).json({
        message: 'Sesión local cerrada exitosamente',
        logoutUrl,
      });
    });
  }
}
