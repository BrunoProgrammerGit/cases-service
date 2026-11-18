import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class GatewaySecretGuard implements CanActivate {
  private readonly expected: Buffer;

  constructor(config: ConfigService) {
    const secret = config.get<string>('GATEWAY_SECRET');
    if (!secret?.trim()) {
      throw new Error('GATEWAY_SECRET debe estar configurado');
    }
    this.expected = Buffer.from(secret);
  }

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const received = Buffer.from(String(req.headers['x-gateway-secret'] ?? ''));
    if (received.length !== this.expected.length || !timingSafeEqual(received, this.expected)) {
      throw new ForbiddenException('Acceso solo a través del gateway');
    }
    return true;
  }
}