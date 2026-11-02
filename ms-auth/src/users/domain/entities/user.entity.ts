import { UserStatus } from '../enums/user-status.enum.js';

export interface UserProps {
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
  passwordHash: string;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(params: {
    id: string;
    codigo: string;
    nombre: string;
    apellido: string;
    ci: string;
    celular: string;
    email: string;
    passwordHash: string;
    tipoUsuario?: string;
    aceptaTerminos?: boolean;
  }): User {
    const trimmedEmail = params.email.trim().toLowerCase();
    if (!trimmedEmail.includes('@')) {
      throw new Error('El formato del correo electrónico es inválido.');
    }

    const trimmedCodigo = params.codigo.trim().toUpperCase();
    if (trimmedCodigo.length === 0) {
      throw new Error('El código de usuario es obligatorio.');
    }

    const trimmedCi = params.ci.trim();
    if (trimmedCi.length === 0) {
      throw new Error('El CI es obligatorio.');
    }

    const now = new Date();
    const aceptaTerminos = params.aceptaTerminos ?? false;

    return new User({
      id: params.id,
      codigo: trimmedCodigo,
      nombre: params.nombre.trim(),
      apellido: params.apellido.trim(),
      estado: UserStatus.ACTIVO,
      ci: trimmedCi,
      celular: params.celular.trim(),
      email: trimmedEmail,
      aceptaTerminos,
      fechaAceptaTerminos: aceptaTerminos ? now : null,
      tipoUsuario: params.tipoUsuario ?? 'USUARIO',
      fechaRegistro: now,
      passwordHash: params.passwordHash,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Getters
  getId(): string { return this.props.id; }
  getCodigo(): string { return this.props.codigo; }
  getNombre(): string { return this.props.nombre; }
  getApellido(): string { return this.props.apellido; }
  getEstado(): string { return this.props.estado; }
  getCi(): string { return this.props.ci; }
  getCelular(): string { return this.props.celular; }
  getEmail(): string { return this.props.email; }
  isAceptaTerminos(): boolean { return this.props.aceptaTerminos; }
  getFechaAceptaTerminos(): Date | null { return this.props.fechaAceptaTerminos; }
  getTipoUsuario(): string { return this.props.tipoUsuario; }
  getFechaRegistro(): Date { return this.props.fechaRegistro; }
  getPasswordHash(): string { return this.props.passwordHash; }
  getUpdatedAt(): Date { return this.props.updatedAt; }
  getDeletedAt(): Date | null { return this.props.deletedAt; }

  isActive(): boolean {
    return this.props.estado === UserStatus.ACTIVO && this.props.deletedAt === null;
  }

  // Mutadores de dominio
  updateProfile(params: {
    nombre?: string;
    apellido?: string;
    celular?: string;
    tipoUsuario?: string;
  }): void {
    if (params.nombre !== undefined) this.props.nombre = params.nombre.trim();
    if (params.apellido !== undefined) this.props.apellido = params.apellido.trim();
    if (params.celular !== undefined) this.props.celular = params.celular.trim();
    if (params.tipoUsuario !== undefined) this.props.tipoUsuario = params.tipoUsuario;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.estado = UserStatus.INACTIVO;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.estado = UserStatus.ACTIVO;
    this.props.updatedAt = new Date();
  }

  acceptTerms(): void {
    this.props.aceptaTerminos = true;
    this.props.fechaAceptaTerminos = new Date();
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.estado = UserStatus.INACTIVO;
    this.props.updatedAt = new Date();
  }
}
