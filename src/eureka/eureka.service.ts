import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Eureka } = require('eureka-js-client'); // librería CommonJS; evita fricción con los tipos

@Injectable()
export class EurekaService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(EurekaService.name);
  private client: any;

  onApplicationBootstrap() {
    const port = Number(process.env.PORT ?? 8082);
    const host = process.env.SERVICE_HOST ?? 'localhost';

    this.client = new Eureka({
      instance: {
        app: 'casos-service', // Eureka lo muestra como CASOS-SERVICE
        instanceId: `casos-service:${port}`,
        hostName: host,
        ipAddr: '127.0.0.1',
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
        host: process.env.EUREKA_HOST ?? 'localhost',
        port: Number(process.env.EUREKA_PORT ?? 8761),
        servicePath: '/eureka/apps/', // ruta que usa el Eureka de Spring
      },
    });

    this.client.start((err?: Error) =>
      err ? this.logger.error(`No se pudo registrar en Eureka: ${err.message}`)
          : this.logger.log('Registrado en Eureka como CASOS-SERVICE'),
    );
  }

  onApplicationShutdown() {
    this.client?.stop(); // se da de baja de Eureka al apagar
  }
}