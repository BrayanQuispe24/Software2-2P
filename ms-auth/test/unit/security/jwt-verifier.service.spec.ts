import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { UnauthorizedException } from '@nestjs/common';
import { JwtVerifierService } from '../../../src/security/jwt-verifier.service.js';

describe('JwtVerifierService', () => {
  let publicKey: Parameters<typeof exportJWK>[0];
  let privateKey: Parameters<typeof exportJWK>[0];
  let verifier: JwtVerifierService;

  const issuer = 'http://localhost:4000/oidc';
  const audience = 'urn:app:api';

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256', { modulusLength: 2048 });
    publicKey = pair.publicKey;
    privateKey = pair.privateKey;

    verifier = new JwtVerifierService({
      issuer,
      audience,
      keyStore: async () => publicKey,
    });
  });

  it('verifica exitosamente un JWT válido y extrae roles y permisos', async () => {
    const token = await new SignJWT({
      roles: ['ADMINISTRADOR'],
      permissions: ['usuarios.leer', 'usuarios.crear'],
      codigo: 'ADM-001',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject('user-uuid-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    const result = await verifier.verify(token);

    expect(result.userId).toBe('user-uuid-123');
    expect(result.roles).toEqual(['ADMINISTRADOR']);
    expect(result.permissions).toEqual(['usuarios.leer', 'usuarios.crear']);
    expect(result.claims).toHaveProperty('codigo', 'ADM-001');
  });

  it('rechaza un JWT expirado', async () => {
    const expiredToken = await new SignJWT({ roles: ['CLIENTE'] })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject('user-uuid-123')
      .setIssuedAt(Math.floor(Date.now() / 1000) - 100)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(privateKey);

    await expect(verifier.verify(expiredToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza un JWT con firma alterada', async () => {
    const validToken = await new SignJWT({ roles: ['CLIENTE'] })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject('user-uuid-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    // Alteramos los últimos caracteres de la firma
    const tamperedToken = validToken.slice(0, -6) + 'XXXXXX';

    await expect(verifier.verify(tamperedToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza un JWT con emisor (issuer) incorrecto', async () => {
    const wrongIssuerToken = await new SignJWT({ roles: ['CLIENTE'] })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer('http://fraudulent-issuer.com')
      .setAudience(audience)
      .setSubject('user-uuid-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    await expect(verifier.verify(wrongIssuerToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza un JWT con audiencia incorrecta', async () => {
    const wrongAudienceToken = await new SignJWT({ roles: ['CLIENTE'] })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(issuer)
      .setAudience('urn:wrong:api')
      .setSubject('user-uuid-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    await expect(verifier.verify(wrongAudienceToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza un JWT firmado con un algoritmo no autorizado (ej. HS256 simétrico)', async () => {
    const secret = new TextEncoder().encode('super-secret-key-that-is-at-least-32-bytes');
    const symmetricToken = await new SignJWT({ roles: ['CLIENTE'] })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject('user-uuid-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(secret);

    await expect(verifier.verify(symmetricToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
