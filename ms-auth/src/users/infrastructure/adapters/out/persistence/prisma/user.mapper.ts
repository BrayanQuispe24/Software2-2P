import { User as PrismaUserModel } from '../../../../../../generated/prisma/client.js';
import { User } from '../../../../../domain/entities/user.entity.js';

export class UserMapper {
  static toDomain(raw: PrismaUserModel): User {
    return User.reconstitute({
      id: raw.id,
      codigo: raw.codigo,
      nombre: raw.nombre,
      apellido: raw.apellido,
      estado: raw.estado,
      ci: raw.ci,
      celular: raw.celular,
      email: raw.email,
      aceptaTerminos: raw.aceptaTerminos,
      fechaAceptaTerminos: raw.fechaAceptaTerminos,
      tipoUsuario: raw.tipoUsuario,
      fechaRegistro: raw.fechaRegistro,
      passwordHash: raw.passwordHash,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(user: User): PrismaUserModel {
    return {
      id: user.getId(),
      codigo: user.getCodigo(),
      nombre: user.getNombre(),
      apellido: user.getApellido(),
      estado: user.getEstado(),
      ci: user.getCi(),
      celular: user.getCelular(),
      email: user.getEmail(),
      aceptaTerminos: user.isAceptaTerminos(),
      fechaAceptaTerminos: user.getFechaAceptaTerminos(),
      tipoUsuario: user.getTipoUsuario(),
      fechaRegistro: user.getFechaRegistro(),
      passwordHash: user.getPasswordHash(),
      updatedAt: user.getUpdatedAt(),
      deletedAt: user.getDeletedAt(),
    };
  }
}
