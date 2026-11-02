import { randomUUID } from 'node:crypto';
import { User } from '../../domain/entities/user.entity.js';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error.js';
import { UserRepositoryPort } from '../ports/out/user-repository.port.js';
import { PasswordHasherPort } from '../ports/out/password-hasher.port.js';
import { CreateUserCommand } from '../models/create-user.command.js';
import { UserResult, toUserResult } from '../models/user.result.js';

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserResult> {
    const email = command.email.trim().toLowerCase();
    const ci = command.ci.trim();
    const rawCodigo = command.codigo?.trim() || `CLI-${ci}`;
    const codigo = rawCodigo.toUpperCase();

    // Validar duplicados de negocio
    const [byEmail, byCodigo, byCi] = await Promise.all([
      this.userRepository.findByEmail(email),
      this.userRepository.findByCodigo(codigo),
      this.userRepository.findByCi(ci),
    ]);

    if (byEmail) {
      throw new UserAlreadyExistsError('correo electrónico', email);
    }
    if (byCodigo) {
      throw new UserAlreadyExistsError('código', codigo);
    }
    if (byCi) {
      throw new UserAlreadyExistsError('CI', ci);
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const id = randomUUID();
    const assignedRole = command.role ?? command.tipoUsuario ?? 'CLIENTE';

    const user = User.create({
      id,
      codigo,
      nombre: command.nombre,
      apellido: command.apellido,
      ci,
      celular: command.celular,
      email,
      passwordHash,
      tipoUsuario: assignedRole,
      aceptaTerminos: command.aceptaTerminos,
    });

    await this.userRepository.save(user, assignedRole);

    return toUserResult(user);
  }
}
