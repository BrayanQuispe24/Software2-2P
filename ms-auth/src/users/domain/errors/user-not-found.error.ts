export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Usuario con identificador '${identifier}' no fue encontrado.`);
    this.name = 'UserNotFoundError';
  }
}
