import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const roles = String(req.headers['x-roles'] ?? '').split(',').map((r) => r.trim());
    if (!roles.includes('ADMIN')) throw new ForbiddenException('Se requiere rol ADMIN');
    return true;
  }
}