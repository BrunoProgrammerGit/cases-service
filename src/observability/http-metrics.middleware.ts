import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { HttpMetricsService } from './http-metrics.service';

const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);

export function createHttpMetricsMiddleware(metrics: HttpMetricsService): RequestHandler {
  return (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();

    response.once('finish', () => {
      const method = allowedMethods.has(request.method) ? request.method : 'OTHER';
      const routePath = request.route?.path;
      const uri = typeof routePath === 'string' ? normalizeRoute(routePath) : 'unmatched';
      const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;

      metrics.observeRequest(method, uri, response.statusCode, durationSeconds);
    });

    next();
  };
}

function normalizeRoute(routePath: string): string {
  return routePath.startsWith('/') ? routePath : `/${routePath}`;
}
