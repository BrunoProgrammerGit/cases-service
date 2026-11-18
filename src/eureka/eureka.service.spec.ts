import { AddressInfo } from 'node:net';
import { createServer, Server } from 'node:http';
import { Test, TestingModule } from '@nestjs/testing';
import { EurekaService } from './eureka.service';

describe('EurekaService registration resilience', () => {
  const environmentNames = [
    'PORT',
    'SERVICE_HOST',
    'EUREKA_HOST',
    'EUREKA_PORT',
    'EUREKA_MAX_RETRIES',
    'EUREKA_REQUEST_RETRY_DELAY_MS',
    'EUREKA_HEARTBEAT_INTERVAL_MS',
    'EUREKA_RETRY_INITIAL_DELAY_MS',
    'EUREKA_RETRY_MAX_DELAY_MS',
  ];
  const originalEnvironment = new Map<string, string | undefined>();

  let app: TestingModule | undefined;
  let eurekaStub: Server | undefined;
  let registrationAttempts = 0;
  let successfulRegistrations = 0;
  let heartbeatAttempts = 0;
  let successfulHeartbeats = 0;
  let deregistrationAttempts = 0;
  let failNextHeartbeat = false;
  let returnNotFoundOnNextHeartbeat = false;

  beforeEach(() => {
    for (const name of environmentNames)
      originalEnvironment.set(name, process.env[name]);

    process.env.PORT = '8082';
    process.env.SERVICE_HOST = 'cases-test';
    process.env.EUREKA_HOST = '127.0.0.1';
    process.env.EUREKA_MAX_RETRIES = '0';
    process.env.EUREKA_REQUEST_RETRY_DELAY_MS = '10';
    process.env.EUREKA_HEARTBEAT_INTERVAL_MS = '40';
    process.env.EUREKA_RETRY_INITIAL_DELAY_MS = '20';
    process.env.EUREKA_RETRY_MAX_DELAY_MS = '40';

    registrationAttempts = 0;
    successfulRegistrations = 0;
    heartbeatAttempts = 0;
    successfulHeartbeats = 0;
    deregistrationAttempts = 0;
    failNextHeartbeat = false;
    returnNotFoundOnNextHeartbeat = false;
  });

  afterEach(async () => {
    if (app) {
      app.get(EurekaService).onApplicationShutdown();
      if (eurekaStub?.listening)
        await waitFor(() => deregistrationAttempts > 0);
    }
    await app?.close();
    await closeServer(eurekaStub);
    eurekaStub = undefined;

    for (const name of environmentNames) {
      const value = originalEnvironment.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    originalEnvironment.clear();
  });

  it('registers after Eureka becomes available and recovers heartbeats and a lost registration', async () => {
    const port = await getAvailablePort();
    process.env.EUREKA_PORT = String(port);

    app = await Test.createTestingModule({
      providers: [EurekaService],
    }).compile();
    await app.init();

    // Let the initial connection fail before the stub starts accepting Eureka requests.
    await delay(30);
    expect(successfulRegistrations).toBe(0);

    eurekaStub = createServer((request, response) => {
      const path = request.url ?? '';

      if (
        request.method === 'POST' &&
        path.endsWith('/eureka/apps/casos-service')
      ) {
        registrationAttempts += 1;
        successfulRegistrations += 1;
        response.statusCode = 204;
        response.end();
        return;
      }

      if (request.method === 'GET' && path.endsWith('/eureka/apps/')) {
        response.statusCode = 200;
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ applications: { application: [] } }));
        return;
      }

      if (
        request.method === 'PUT' &&
        path.includes('/eureka/apps/casos-service/')
      ) {
        heartbeatAttempts += 1;
        if (failNextHeartbeat) {
          failNextHeartbeat = false;
          response.statusCode = 503;
          response.end();
          return;
        }
        if (returnNotFoundOnNextHeartbeat) {
          returnNotFoundOnNextHeartbeat = false;
          response.statusCode = 404;
          response.end();
          return;
        }
        successfulHeartbeats += 1;
        response.statusCode = 200;
        response.end();
        return;
      }

      if (request.method === 'DELETE') {
        deregistrationAttempts += 1;
        response.statusCode = 200;
        response.end();
        return;
      }

      response.statusCode = 404;
      response.end();
    });

    await listen(eurekaStub, port);
    await waitFor(() => successfulRegistrations === 1);
    expect(registrationAttempts).toBe(1);

    failNextHeartbeat = true;
    await waitFor(() => heartbeatAttempts >= 2 && successfulHeartbeats >= 1);

    returnNotFoundOnNextHeartbeat = true;
    await waitFor(() => successfulRegistrations === 2);
    expect(registrationAttempts).toBe(2);
  });
});

async function getAvailablePort(): Promise<number> {
  const probe = createServer();
  await listen(probe, 0);
  const port = (probe.address() as AddressInfo).port;
  await closeServer(probe);
  return port;
}

function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
}

function closeServer(server?: Server): Promise<void> {
  if (!server?.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(
  condition: () => boolean,
  timeoutMs = 3_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() >= deadline)
      throw new Error('Timed out waiting for Eureka stub activity');
    await delay(10);
  }
}
