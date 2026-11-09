import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.mjs',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://auth_user:auth_dev_password@db-auth:5432/ms_auth_db?schema=public',
  },
});
