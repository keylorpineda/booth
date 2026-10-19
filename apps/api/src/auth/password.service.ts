import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/** Argon2id with the library defaults (OWASP-recommended memory and time costs). */
@Injectable()
export class PasswordService {
  /** Verified when the email is unknown, so login timing does not reveal registered emails. */
  private readonly dummyHash = hash('booth-dummy-password');

  hash(password: string): Promise<string> {
    return hash(password);
  }

  async verify(passwordHash: string | null, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash ?? (await this.dummyHash), password);
    } catch {
      return false;
    }
  }
}
