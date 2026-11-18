import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpErrorFilter } from './http-error.filter';

function hostFor(requestId?: string) {
  const output: { status?: number; body?: Record<string, unknown> } = {};
  const response = {
    status(code: number) {
      output.status = code;
      return this;
    },
    json(body: Record<string, unknown>) {
      output.body = body;
      return this;
    },
  };
  const request = { header: () => requestId };
  const http = { getRequest: () => request, getResponse: () => response };
  return {
    output,
    host: { switchToHttp: () => http } as never,
  };
}

describe('HttpErrorFilter', () => {
  it('maps forbidden errors to the shared envelope and propagates a safe request id', () => {
    const { output, host } = hostFor('req-123');
    new HttpErrorFilter().catch(new HttpException('No autorizado', HttpStatus.FORBIDDEN), host);
    expect(output).toEqual({
      status: 403,
      body: { status: 403, error: 'FORBIDDEN', message: 'No autorizado', requestId: 'req-123' },
    });
  });

  it('does not expose an unexpected exception message', () => {
    const { output, host } = hostFor();
    new HttpErrorFilter().catch(new Error('database password leaked'), host);
    expect(output).toEqual({
      status: 500,
      body: { status: 500, error: 'INTERNAL_ERROR', message: 'Error interno del servicio' },
    });
  });
});
