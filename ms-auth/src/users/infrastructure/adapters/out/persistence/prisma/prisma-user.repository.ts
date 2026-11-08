import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../../infrastructure/adapters/out/persistence/prisma/prisma.service.js';
import { UserRepositoryPort } from '../../../../../application/ports/out/user-repository.port.js';
import { User } from '../../../../../domain/entities/user.entity.js';
import { UserAlreadyExistsError } from '../../../../../domain/errors/user-already-exists.error.js';
import { UserMapper } from './user.mapper.js';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User, roleName?: string): Promise<void> {
    const data = UserMapper.toPersistence(user);
    const assignedRole = roleName ?? user.getTipoUsuario() ?? 'CLIENTE';
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.create({ data });
        const role = await tx.role.findFirst({
          where: { name: assignedRole },
        });
        if (role) {
          await tx.userRole.create({
            data: {
              userId: user.getId(),
              roleId: role.id,
            },
          });
        }
      });
    } catch (error: any) {
      if (error && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'campo único';
        throw new UserAlreadyExistsError(target, 'valor duplicado');
      }
      throw error;
    }
  }

  async update(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.getId() },
          data: {
            nombre: data.nombre,
            apellido: data.apellido,
            estado: data.estado,
            celular: data.celular,
            tipoUsuario: data.tipoUsuario,
            aceptaTerminos: data.aceptaTerminos,
            fechaAceptaTerminos: data.fechaAceptaTerminos,
            updatedAt: data.updatedAt,
            deletedAt: data.deletedAt,
          },
        });

        if (data.tipoUsuario) {
          const role = await tx.role.findFirst({
            where: { name: data.tipoUsuario },
          });
          if (role) {
            await tx.userRole.deleteMany({
              where: { userId: user.getId() },
            });
            await tx.userRole.create({
              data: {
                userId: user.getId(),
                roleId: role.id,
              },
            });
          }
        }
      });
    } catch (error: any) {
      if (error && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'campo único';
        throw new UserAlreadyExistsError(target, 'valor duplicado');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByCodigo(codigo: string): Promise<User | null> {
    const raw = await this.prisma.user.findFirst({
      where: { codigo: codigo.trim().toUpperCase(), deletedAt: null },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByCi(ci: string): Promise<User | null> {
    const raw = await this.prisma.user.findFirst({
      where: { ci: ci.trim(), deletedAt: null },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findForAuth(identifier: string): Promise<User | null> {
    const term = identifier.trim();
    const raw = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { email: term.toLowerCase() },
          { codigo: term.toUpperCase() },
          { ci: term },
        ],
      },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { fechaRegistro: 'desc' },
    });
    return rows.map(UserMapper.toDomain);
  }
}
