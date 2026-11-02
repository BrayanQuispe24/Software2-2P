import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as oidc from 'openid-client';

@Injectable()
export class AuthService implements OnModuleInit {
  private oidcConfig!: oidc.Configuration;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const issuer = this.config.getOrThrow<string>('OIDC_ISSUER');
    const clientId = this.config.getOrThrow<string>('OIDC_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('OIDC_CLIENT_SECRET');

    this.oidcConfig = await oidc.discovery(
      new URL(issuer),
      clientId,
      clientSecret,
      oidc.ClientSecretBasic(clientSecret),
      {
        execute: [oidc.allowInsecureRequests],
      },
    );
  }

  async createAuthorizationRequest() {
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const redirectUri = this.config.getOrThrow<string>('OIDC_REDIRECT_URI');

    const url = oidc.buildAuthorizationUrl(this.oidcConfig, {
      redirect_uri: redirectUri,
      scope: 'openid profile email api:read api:write offline_access',
      response_type: 'code',
      resource: 'urn:app:api',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    });

    return {
      url: url.toString(),
      state,
      nonce,
      codeVerifier,
    };
  }

  async exchangeCode(
    callbackUrl: URL,
    codeVerifier: string,
    state: string,
    nonce: string,
  ) {
    return await oidc.authorizationCodeGrant(
      this.oidcConfig,
      callbackUrl,
      {
        pkceCodeVerifier: codeVerifier,
        expectedState: state,
        expectedNonce: nonce,
      },
      {
        resource: 'urn:app:api',
      },
    );
  }

  async refreshToken(refreshToken: string) {
    return await oidc.refreshTokenGrant(this.oidcConfig, refreshToken);
  }

  buildLogoutUrl(idToken?: string, postLogoutRedirectUri?: string): string {
    const params: Record<string, string> = {};
    if (idToken) {
      params.id_token_hint = idToken;
    }
    if (postLogoutRedirectUri) {
      params.post_logout_redirect_uri = postLogoutRedirectUri;
    }
    return oidc.buildEndSessionUrl(this.oidcConfig, params).toString();
  }
}
