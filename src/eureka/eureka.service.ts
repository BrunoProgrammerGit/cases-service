import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Eureka } = require('eureka-js-client'); // librería CommonJS; evita fricción con los tipos

@Injectable()
export class EurekaService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(EurekaService.name);
  private client: any;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private retryAttempt = 0;
  private registrationAttemptInProgress = false;
  private registered = false;
  private shuttingDown = false;

  onApplicationBootstrap(): void {
    const port = Number(process.env.PORT ?? 8082);
    const host = process.env.SERVICE_HOST ?? 'localhost';
    const eurekaHost = process.env.EUREKA_HOST ?? 'localhost';
    const eurekaPort = Number(process.env.EUREKA_PORT ?? 8762);

    this.client = new Eureka({
      instance: {
        app: 'casos-service', // Eureka lo muestra como CASOS-SERVICE
        instanceId: `${host}:casos-service:${port}`,
        hostName: host,
        ipAddr: host,
        port: { $: port, '@enabled': true },
        vipAddress: 'casos-service',
        statusPageUrl: `http://${host}:${port}/docs`,
        healthCheckUrl: `http://${host}:${port}/health`,
        dataCenterInfo: {
          '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          name: 'MyOwn',
        },
      },
      eureka: {
        host: eurekaHost,
        port: eurekaPort,
        servicePath: '/eureka/apps/', // ruta que usa el Eureka de Spring
        maxRetries: this.getNonNegativeInteger('EUREKA_MAX_RETRIES', 3),
        requestRetryDelay: this.getPositiveInteger(
          'EUREKA_REQUEST_RETRY_DELAY_MS',
          500,
        ),
        heartbeatInterval: this.getPositiveInteger(
          'EUREKA_HEARTBEAT_INTERVAL_MS',
          30_000,
        ),
      },
    });

    this.client.on('registered', () => this.onRegistered());
    this.startRegistrationAttempt();
  }

  onApplicationShutdown(): void {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.clearRetryTimer();
    this.client?.stop(); // se da de baja de Eureka al apagar
  }

  private startRegistrationAttempt(): void {
    if (
      this.shuttingDown ||
      this.registered ||
      this.registrationAttemptInProgress ||
      !this.client
    ) {
      return;
    }

    this.registrationAttemptInProgress = true;
    try {
      this.client.start((err?: Error) => {
        this.registrationAttemptInProgress = false;
        if (this.shuttingDown || this.registered) return;

        if (err) {
          this.logger.error(`No se pudo registrar en Eureka: ${err.message}`);
          this.scheduleRegistrationRetry();
          return;
        }

        this.onRegistered();
      });
    } catch (error) {
      this.registrationAttemptInProgress = false;
      if (this.shuttingDown || this.registered) return;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`No se pudo iniciar el registro en Eureka: ${message}`);
      this.scheduleRegistrationRetry();
    }
  }

  private onRegistered(): void {
    if (!this.registered) {
      this.logger.log('Registrado en Eureka como CASOS-SERVICE');
    }
    this.registered = true;
    this.retryAttempt = 0;
    this.clearRetryTimer();

    if (this.shuttingDown) {
      setImmediate(() => this.client?.stop());
    }
  }

  private scheduleRegistrationRetry(): void {
    if (this.shuttingDown || this.registered || this.retryTimer) return;

    const initialDelayMs = this.getPositiveInteger(
      'EUREKA_RETRY_INITIAL_DELAY_MS',
      1_000,
    );
    const maxDelayMs = Math.max(
      initialDelayMs,
      this.getPositiveInteger('EUREKA_RETRY_MAX_DELAY_MS', 30_000),
    );
    const delayMs = Math.min(
      initialDelayMs * 2 ** this.retryAttempt,
      maxDelayMs,
    );
    this.retryAttempt = Math.min(this.retryAttempt + 1, 30);

    this.logger.warn(`Se reintentara el registro con Eureka en ${delayMs} ms`);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      this.startRegistrationAttempt();
    }, delayMs);
    this.retryTimer.unref?.();
  }

  private clearRetryTimer(): void {
    if (!this.retryTimer) return;
    clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
  }

  private getPositiveInteger(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }

  private getNonNegativeInteger(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value >= 0 ? value : fallback;
  }
}
