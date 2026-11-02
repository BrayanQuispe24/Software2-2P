export interface CreateUserCommand {
  codigo?: string;
  nombre: string;
  apellido: string;
  ci: string;
  celular: string;
  email: string;
  password: string;
  tipoUsuario?: string;
  role?: string;
  aceptaTerminos?: boolean;
}
