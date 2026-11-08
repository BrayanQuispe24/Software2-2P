import { generateKeyPair, exportJWK } from 'jose';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const keyFilePath = 'keys/oidc-private.jwks.json';
const force = process.argv.includes('--force');

if (existsSync(keyFilePath) && !force) {
  console.log('Claves OIDC ya existentes. Omitiendo generación.');
  process.exit(0);
}

const { privateKey } = await generateKeyPair('RS256', {
  modulusLength: 3072,
  extractable: true,
});

const jwk = await exportJWK(privateKey);
jwk.kid = randomUUID();
jwk.alg = 'RS256';
jwk.use = 'sig';

await mkdir('keys', { recursive: true });
await writeFile(
  'keys/oidc-private.jwks.json',
  JSON.stringify({ keys: [jwk] }, null, 2),
  { mode: 0o600 },
);

console.log('Claves OIDC generadas.');
