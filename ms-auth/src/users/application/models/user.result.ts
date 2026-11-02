import { User } from '../../domain/entities/user.entity.js';

export interface UserResult {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string;
  estado: string;
  ci: string;
  celular: string;
  email: string;
  aceptaTerminos: boolean;
  fechaAceptaTerminos: Date | null;
  tipoUsuario: string;
  fechaRegistro: Date;
  updatedAt: Date;
}

export function toUserResult(user: User): UserResult {
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
    updatedAt: user.getUpdatedAt(),
  };
}
