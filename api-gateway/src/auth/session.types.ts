import 'express-session';

declare module 'express-session' {
  interface SessionData {
    oidcPending?: {
      state: string;
      nonce: string;
      codeVerifier: string;
    };
    user?: {
      sub: string;
      email?: string;
      name?: string;
      roles?: string[];
      permissions?: string[];
      [key: string]: unknown;
    };
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
