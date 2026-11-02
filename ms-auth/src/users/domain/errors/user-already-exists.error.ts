export class UserAlreadyExistsError extends Error {
  constructor(field: string, value: string) {
    super(`El usuario con ${field} '${value}' ya se encuentra registrado.`);
    this.name = 'UserAlreadyExistsError';
  }
}
