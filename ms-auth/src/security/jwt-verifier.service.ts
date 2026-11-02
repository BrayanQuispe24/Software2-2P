import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface VerifiedJwtPayload {
  userId: string;
  roles: string[];
  permissions: string[];
  claims: Record<string, unknown>;
}

export interface JwtVerifierOptions {
  issuer?: string;
  audience?: string;
  jwksUrl?: string;
  keyStore?: Parameters<typeof jwtVerify>[1];
}

@Injectable()
export class JwtVerifierService {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly keyStore: Parameters<typeof jwtVerify>[1];

  constructor(@Optional() options?: JwtVerifierOptions) {
    this.issuer =
      options?.issuer ?? process.env.OIDC_ISSUER ?? 'http://localhost:4000/oidc';
    this.audience = options?.audience ?? 'urn:app:api';

    if (options?.keyStore) {
      this.keyStore = options.keyStore;
    } else {
      const jwksUri =
        options?.jwksUrl ?? process.env.OIDC_JWKS_URL ?? `${this.issuer}/jwks`;
      this.keyStore = createRemoteJWKSet(new URL(jwksUri));
    }
  }

  async verify(token: string): Promise<VerifiedJwtPayload> {
    try {
      const { payload } = await jwtVerify(token, this.keyStore, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256'],
        clockTolerance: 5,
        requiredClaims: ['sub', 'exp', 'iat'],
      });

      return {
        userId: payload.sub as string,
        roles: (payload.roles as string[]) ?? [],
        permissions: (payload.permissions as string[]) ?? [],
        claims: payload as Record<string, unknown>,
      };
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
