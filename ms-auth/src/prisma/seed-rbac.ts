import { PrismaService } from './prisma.service.js';
import { Role } from '../auth/rbac/enums/role.enum.js';
import { Permission } from '../auth/rbac/enums/permission.enum.js';

export async function seedRbac(prisma: PrismaService): Promise<void> {
  const roles = Object.values(Role);
  const permissions = Object.values(Permission);

  // 1. Upsert de roles
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2. Upsert de permisos
  for (const name of permissions) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 3. Matriz de asignaciones
  const assignments: Record<Role, Permission[]> = {
    [Role.ADMINISTRADOR]: permissions,

    [Role.RECEPCIONISTA]: [
      Permission.USERS_READ,
      Permission.ENROLLMENTS_READ,
      Permission.ENROLLMENTS_MANAGE,
      Permission.CLASSES_READ,
      Permission.PROFILE_READ,
    ],

    [Role.INSTRUCTOR]: [
      Permission.CLASSES_READ,
      Permission.CLASSES_MANAGE,
      Permission.PROFILE_READ,
    ],

    [Role.CLIENTE]: [
      Permission.CLASSES_READ,
      Permission.CLASSES_ENROLL,
      Permission.PROFILE_READ,
    ],
  };

  // 4. Asignación de permisos a roles
  for (const [roleName, rolePermissions] of Object.entries(assignments)) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: roleName },
    });

    for (const permissionName of rolePermissions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { name: permissionName },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}
