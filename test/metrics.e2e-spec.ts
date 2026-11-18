import 'reflect-metadata';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { HealthController } from '../src/health.controller';
import { createHttpMetricsMiddleware } from '../src/observability/http-metrics.middleware';
import { HttpMetricsService } from '../src/observability/http-metrics.service';
import { MetricsAuthGuard } from '../src/observability/metrics-auth.guard';
import { MetricsController } from '../src/observability/metrics.controller';

@Controller('cases')
class MetricsTestCasesController {
  @Get(':id')
  getCase() {
    return { ok: true };
  }
}

describe('Prometheus HTTP metrics endpoint (e2e)', () => {
  let app: INestApplication;
  let passwordDirectory: string;
  const username = 'metrics';
  const testPassword = 'test-only-metrics-password';
  const caseId = 'case-id-that-must-not-be-a-label';

  beforeAll(async () => {
    passwordDirectory = mkdtempSync(join(tmpdir(), 'cases-metrics-test-'));
    const passwordFile = join(passwordDirectory, 'password');
    writeFileSync(passwordFile, testPassword, { encoding: 'utf8', flag: 'wx' });

    const moduleRef = await Test.createTestingModule({
      controllers: [MetricsController, HealthController, MetricsTestCasesController],
      providers: [
        HttpMetricsService,
        MetricsAuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => ({
              METRICS_SCRAPE_USERNAME: username,
              METRICS_SCRAPE_PASSWORD_FILE: passwordFile,
            })[key] ?? fallback,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(createHttpMetricsMiddleware(app.get(HttpMetricsService)));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    rmSync(passwordDirectory, { recursive: true, force: true });
  });

  it('rejects missing, incorrect, and Bearer credentials', async () => {
    await request(app.getHttpServer()).get('/metrics').expect(401);
    await request(app.getHttpServer())
      .get('/metrics')
      .auth(username, 'incorrect-test-password')
      .expect(401);
    await request(app.getHttpServer())
      .get('/metrics')
      .set('authorization', 'Bearer test-only-not-a-real-token')
      .expect(401);
  });

  it('keeps health public and exposes normalized HTTP metrics only with Basic Auth', async () => {
    await request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'UP' });
    await request(app.getHttpServer()).get(`/cases/${caseId}`).expect(200);
    await request(app.getHttpServer()).get('/not-found-test').expect(404);

    const response = await request(app.getHttpServer())
      .get('/metrics')
      .auth(username, testPassword)
      .expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.headers['content-type']).toContain('version=0.0.4');
    expect(response.text).toContain('http_server_requests_seconds_count');
    expect(response.text).toContain('application="cases-service"');
    expect(response.text).toContain('uri="/health"');
    expect(response.text).toContain('status="404"');
    expect(response.text).toContain(':id');
    expect(response.text).not.toContain(caseId);
    expect(response.text).not.toContain('/cases/case-id-that-must-not-be-a-label');
  });
});
