import pg from 'pg';
import * as argon2 from 'argon2';
import crypto from 'node:crypto';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://auth_user:auth_dev_password@localhost:5433/ms_auth_db?schema=public';

const pool = new Pool({ connectionString });

const ROLES = ['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUCTOR', 'CLIENTE'];

const PERMISSIONS = [
  'usuarios.leer',
  'usuarios.crear',
  'usuarios.actualizar',
  'usuarios.eliminar',
  'inscripciones.leer',
  'inscripciones.gestionar',
  'clases.leer',
  'clases.gestionar',
  'clases.inscribirse',
  'perfil.leer',
];

const ASSIGNMENTS = {
  ADMINISTRADOR: PERMISSIONS,
  RECEPCIONISTA: [
    'usuarios.leer',
    'inscripciones.leer',
    'inscripciones.gestionar',
    'clases.leer',
    'perfil.leer',
  ],
  INSTRUCTOR: [
    'clases.leer',
    'clases.gestionar',
    'perfil.leer',
  ],
  CLIENTE: [
    'clases.leer',
    'clases.inscribirse',
    'perfil.leer',
  ],
};

async function seed() {
  const client = await pool.connect();
  console.log('🌱 [ms-auth] Iniciando seeder de RBAC y Usuario Administrador...');

  try {
    await client.query('BEGIN');

    // 1. Roles
    console.log('  -> Sembrando roles...');
    const roleMap = new Map();
    for (const roleName of ROLES) {
      let res = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
      let roleId;
      if (res.rows.length === 0) {
        roleId = crypto.randomUUID();
        await client.query('INSERT INTO roles (id, name) VALUES ($1, $2)', [roleId, roleName]);
      } else {
        roleId = res.rows[0].id;
      }
      roleMap.set(roleName, roleId);
    }

    // 2. Permisos
    console.log('  -> Sembrando permisos...');
    const permMap = new Map();
    for (const permName of PERMISSIONS) {
      let res = await client.query('SELECT id FROM permissions WHERE name = $1', [permName]);
      let permId;
      if (res.rows.length === 0) {
        permId = crypto.randomUUID();
        await client.query('INSERT INTO permissions (id, name) VALUES ($1, $2)', [permId, permName]);
      } else {
        permId = res.rows[0].id;
      }
      permMap.set(permName, permId);
    }

    // 3. Matriz de Rol-Permisos
    console.log('  -> Asignando permisos a roles...');
    for (const [roleName, perms] of Object.entries(ASSIGNMENTS)) {
      const roleId = roleMap.get(roleName);
      for (const permName of perms) {
        const permId = permMap.get(permName);
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [roleId, permId]
        );
      }
    }

    // 4. Usuario Administrador (admin@test.com / Password123!)
    console.log('  -> Sembrando usuario administrador (admin@test.com)...');
    const adminEmail = 'admin@test.com';
    const passwordHash = await argon2.hash('Password123!', {
      type: argon2.argon2id,
    });

    let userRes = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    let adminUserId;

    if (userRes.rows.length === 0) {
      adminUserId = crypto.randomUUID();
      await client.query(
        `INSERT INTO users (
          id, codigo, nombre, apellido, estado, ci, celular, email,
          acepta_terminos, fecha_acepta_terminos, tipo_usuario,
          fecha_registro, password_hash, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), $11, NOW()
        )`,
        [
          adminUserId,
          'ADM-001',
          'Administrador',
          'Sistema',
          'ACTIVO',
          '1000001',
          '70000000',
          adminEmail,
          true,
          'ADMIN',
          passwordHash,
        ]
      );
    } else {
      adminUserId = userRes.rows[0].id;
      await client.query(
        `UPDATE users
         SET password_hash = $1, estado = 'ACTIVO', tipo_usuario = 'ADMIN', updated_at = NOW()
         WHERE id = $2`,
        [passwordHash, adminUserId]
      );
    }

    // 5. Asignar rol ADMINISTRADOR al usuario admin
    const adminRoleId = roleMap.get('ADMINISTRADOR');
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [adminUserId, adminRoleId]
    );

    await client.query('COMMIT');
    console.log('✅ [ms-auth] Seeder completado exitosamente:');
    console.log('   - Roles y Permisos RBAC sincronizados.');
    console.log('   - Usuario: admin@test.com');
    console.log('   - Password: Password123!');
    console.log('   - Rol: ADMINISTRADOR');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ [ms-auth] Error al ejecutar el seeder:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

