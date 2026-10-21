import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

const ADMIN = 'ADMIN';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const raw = req.headers['x-roles'];
    const header = Array.isArray(raw) ? raw.join(',') : String(raw ?? '');
    const roles = header
      .split(',')
      .map((r) => r.trim().toUpperCase().replace(/^ROLE_/, '')) // ROLE_ADMIN -> ADMIN
      .filter(Boolean);

    if (!roles.includes(ADMIN)) throw new ForbiddenException('Se requiere rol ADMIN');
    return true;
  }
}