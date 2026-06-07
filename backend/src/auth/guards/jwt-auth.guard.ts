import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppConfigService } from '../../config/app-config.service';
import { UsersService } from '../users.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

type JwtVerifyResult = { payload: Record<string, any> };
type JoseModule = {
  createRemoteJWKSet: (url: URL) => unknown;
  jwtVerify: (
    token: string,
    key: unknown,
    options: { issuer: string; audience: string },
  ) => Promise<JwtVerifyResult>;
};

/**
 * Global guard that verifies Supabase-issued access tokens against the
 * project's public JWKS (asymmetric ES256 signing keys) and provisions a
 * local user row from the token claims.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private jose: JoseModule | null = null;
  private jwks: unknown = null;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfigService,
    private readonly users: UsersService,
  ) {}

  private async getJwks(): Promise<{ jose: JoseModule; jwks: unknown }> {
    if (!this.jose) {
      // jose is ESM-only; load it via dynamic import under CommonJS.
      this.jose = (await import('jose')) as unknown as JoseModule;
    }
    if (!this.jwks) {
      this.jwks = this.jose.createRemoteJWKSet(
        new URL(this.config.supabaseJwksUrl),
      );
    }
    return { jose: this.jose, jwks: this.jwks };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice('Bearer '.length).trim();

    let payload: Record<string, any>;
    try {
      const { jose, jwks } = await this.getJwks();
      const result = await jose.jwtVerify(token, jwks, {
        issuer: this.config.supabaseJwtIssuer,
        audience: 'authenticated',
      });
      payload = result.payload;
    } catch (error) {
      this.logger.debug(`JWT verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = payload.sub as string;
    if (!userId) {
      throw new UnauthorizedException('Token missing subject');
    }
    const email = (payload.email as string) ?? null;
    const name =
      (payload.user_metadata?.name as string) ??
      (payload.user_metadata?.full_name as string) ??
      null;

    await this.users.ensureUser(userId, email, name);
    request.user = { userId, email };
    return true;
  }
}
