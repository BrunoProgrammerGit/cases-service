import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { readFileSync } from 'fs';
import type { Request } from 'express';

@Injectable()
export class MetricsAuthGuard implements CanActivate {
  private readonly expectedAuthorization: Buffer | undefined;

  constructor(config: ConfigService) {
    const username = config.get<string>('METRICS_SCRAPE_USERNAME') ?? 'metrics';
    const password = this.readPassword(config);
    this.expectedAuthorization = password
      ? Buffer.from(`Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`, 'utf8')
      : undefined;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const received = Buffer.from(request.headers.authorization ?? '', 'utf8');
    const expected = this.expectedAuthorization;

    if (!expected) {
      throw new UnauthorizedException();
    }

    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private readPassword(config: ConfigService): string | undefined {
    const passwordFile = config.get<string>(
      'METRICS_SCRAPE_PASSWORD_FILE',
      '/run/secrets/metrics_scrape_password',
    );

    try {
      return readFileSync(passwordFile, 'utf8').replace(/[\r\n]+$/, '');
    } catch {
      return undefined;
    }
  }
}
