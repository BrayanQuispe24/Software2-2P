import http from 'node:http';
import { randomBytes, createHash } from 'node:crypto';

const issuer = 'http://localhost:4000/oidc';
const clientId = 'cliente-pruebas';
const redirectUri = 'http://127.0.0.1:3333/callback';

const metadata = await fetch(`${issuer}/.well-known/openid-configuration`).then(
  async (response) => {
    if (!response.ok) {
      throw new Error('No se pudo obtener OIDC Discovery');
    }
    return response.json();
  },
);

if (metadata.issuer !== issuer) {
  throw new Error('Issuer inesperado');
}

const base64url = (input) => Buffer.from(input).toString('base64url');
const verifier = base64url(randomBytes(32));
const challenge = createHash('sha256').update(verifier).digest('base64url');
const state = base64url(randomBytes(24));
const nonce = base64url(randomBytes(24));

const authorizationUrl = new URL(metadata.authorization_endpoint);
authorizationUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: 'openid profile email api:read api:write',
  resource: 'urn:app:api',
  state,
  nonce,
  code_challenge: challenge,
  code_challenge_method: 'S256',
}).toString();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1:3333');
    if (url.pathname !== '/callback') {
      res.writeHead(404).end();
      return;
    }

    if (url.searchParams.get('state') !== state) {
      throw new Error('State inválido');
    }

    if (url.searchParams.has('error')) {
      throw new Error(
        url.searchParams.get('error_description') ??
          url.searchParams.get('error'),
      );
    }

    const code = url.searchParams.get('code');
    if (!code) {
      throw new Error('No se recibió código de autorización');
    }

    const response = await fetch(metadata.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
        resource: 'urn:app:api',
      }),
    });

    const tokens = await response.json();
    if (!response.ok) {
      throw new Error(`Token endpoint: ${JSON.stringify(tokens)}`);
    }

    if (!tokens.access_token || !tokens.id_token) {
      throw new Error('Faltan tokens requeridos');
    }

    console.log('✅ Authorization Code + PKCE correcto');
    console.log('✅ Access Token recibido:', true);
    console.log('✅ ID Token recibido:', true);
    console.log('Token type:', tokens.token_type);
    console.log('Expires in:', tokens.expires_in);

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end('Flujo OAuth 2.0/OIDC completado exitosamente. Puedes cerrar esta pestaña.');
  } catch (error) {
    console.error('Error:', error.message);
    res.writeHead(400).end('Error de autenticación');
  } finally {
    server.close();
  }
});

server.listen(3333, '127.0.0.1', () => {
  console.log('\n========================================');
  console.log('Abre esta URL en tu navegador para probar:');
  console.log(authorizationUrl.toString());
  console.log('========================================\n');
});
