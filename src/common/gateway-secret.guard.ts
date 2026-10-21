import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class GatewaySecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const expected = this.config.get<string>('GATEWAY_SECRET');
    if (!expected) return true; // modo desarrollo: sin secreto no se exige

    const req = ctx.switchToHttp().getRequest();
    const received = Buffer.from(String(req.headers['x-gateway-secret'] ?? ''));
    const wanted = Buffer.from(expected);
    if (received.length !== wanted.length || !timingSafeEqual(received, wanted)) {
      throw new ForbiddenException('Acceso solo a través del gateway');
    }
    return true;
  }
}