import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpMetricsService } from './observability/http-metrics.service';
import { createHttpMetricsMiddleware } from './observability/http-metrics.middleware';
import { HttpErrorFilter } from './common/http-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.use(createHttpMetricsMiddleware(app.get(HttpMetricsService)));
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  }));

  const doc = new DocumentBuilder()
    .setTitle('casos-service')
    .setDescription('Biblioteca de casos, tablero y validación de Death-Doku')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc));

  const port = Number(process.env.PORT ?? 8082);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
