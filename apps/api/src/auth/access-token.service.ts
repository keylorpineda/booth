import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { type AppConfig } from '../config/app-config';
import { InjectConfig } from '../config/config.module';

interface AccessTokenPayload {
  sub: string;
}

const ISSUER = 'booth-api';
const AUDIENCE = 'booth-web';

/** Short-lived HS256 access tokens. They only carry the user id; everything else is loaded fresh. */
@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  get expiresInSeconds(): number {
    return this.config.auth.accessTtlSeconds;
  }

  sign(userId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId };
    return this.jwt.signAsync(payload, {
      secret: this.config.auth.accessSecret,
      expiresIn: this.expiresInSeconds,
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithm: 'HS256',
    });
  }

  /** Returns the user id, or null for any invalid, expired or tampered token. */
  async verify(token: string): Promise<string | null> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.auth.accessSecret,
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256'],
      });
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
