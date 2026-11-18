import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

function codeFor(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 502:
      return 'UPSTREAM_ERROR';
    case 503:
      return 'UPSTREAM_UNAVAILABLE';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';
  }
}

function safeMessage(status: number, value: unknown): string {
  if (status >= 500) {
    return status === 503
      ? 'Un servicio requerido no está disponible'
      : status === 502
        ? 'Error al consultar un servicio requerido'
        : 'Error interno del servicio';
  }
  if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 300);
  return status === 422 ? 'La solicitud contiene campos inválidos' : 'La solicitud no es válida';
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const responseObject =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : undefined;
    const rawMessage = responseObject?.message ?? exceptionResponse;
    const message = safeMessage(status, rawMessage);
    const body: Record<string, unknown> = {
      status,
      error: codeFor(status),
      message,
    };
    const requestId = request.header('x-request-id');
    if (requestId && REQUEST_ID.test(requestId)) body.requestId = requestId;
    if (status === 422 && Array.isArray(rawMessage)) {
      body.details = { errors: rawMessage.map((item) => String(item).slice(0, 200)) };
    }
    response.status(status).json(body);
  }
}
