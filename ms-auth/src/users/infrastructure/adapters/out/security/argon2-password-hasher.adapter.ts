import * as argon2 from 'argon2';
import { PasswordHasherPort } from '../../../../application/ports/out/password-hasher.port.js';

export class Argon2PasswordHasherAdapter implements PasswordHasherPort {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
    });
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
