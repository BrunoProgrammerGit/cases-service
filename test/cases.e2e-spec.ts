import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';
import request from 'supertest';
import { CasesController } from '../src/cases/cases.controller';
import { CasesService } from '../src/cases/cases.service';
import { GatewaySecretGuard } from '../src/common/gateway-secret.guard';

// The HTTP layer, actual controller/service and gateway guard are real. Only
// MongoDB is replaced with a deterministic in-memory model double.
const caseId = '507f1f77bcf86cd799439011';
const caseDocument = {
  _id: caseId,
  title: 'Caso de prueba',
  category: 'HOGAR',
  difficulty: 'EASY',
  rows: 2,
  columns: 2,
  cells: [
    { x: 0, y: 0, occupable: true, type: 'ROOM', name: 'Sala' },
    { x: 1, y: 0, occupable: true, type: 'ROOM', name: 'Sala' },
    { x: 0, y: 1, occupable: true, type: 'ROOM', name: 'Sala' },
    { x: 1, y: 1, occupable: true, type: 'ROOM', name: 'Sala' },
  ],
  characters: [{ id: 'v', name: 'Victima', role: 'VICTIM' }, { id: 's', name: 'Sospechoso', role: 'SUSPECT' }],
  clues: [{ id: 'c1', text: 'Pista', scope: 'GENERAL' }],
  hints: [{ level: 1, text: 'Primera ayuda' }, { level: 2, text: 'Segunda ayuda' }],
  solution: {
    killerId: 's',
    positions: [{ characterId: 'v', x: 0, y: 0 }, { characterId: 's', x: 1, y: 0 }],
  },
};

describe('Cases HTTP endpoints (e2e)', () => {
  let app: INestApplication;
  const secret = 'test-only-gateway-secret';
  const model = {
    find: jest.fn(() => ({ select: jest.fn().mockReturnThis(), lean: async () => [caseDocument] })),
    findById: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      lean: async () => caseDocument,
    })),
  };

  beforeAll(async () => {
    const service = new CasesService(model as any);
    const moduleRef = await Test.createTestingModule({
      controllers: [CasesController],
      providers: [
        GatewaySecretGuard,
        { provide: ConfigService, useValue: { get: (key: string) => key === 'GATEWAY_SECRET' ? secret : undefined } },
        { provide: CasesService, useValue: service },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => app.close());

  const authorized = (method: 'get' | 'post', path: string) =>
    request(app.getHttpServer())[method](path).set('x-gateway-secret', secret);

  it('requires the existing gateway guard', async () => {
    await request(app.getHttpServer()).get('/cases').expect(403);
  });

  it('returns case summaries without private solution data', async () => {
    const response = await authorized('get', '/cases').expect(200);
    expect(response.body).toEqual([{
      id: caseId, title: 'Caso de prueba', category: 'HOGAR', difficulty: 'EASY', rows: 2, columns: 2,
    }]);
    expect(JSON.stringify(response.body)).not.toContain('solution');
    expect(JSON.stringify(response.body)).not.toContain('hints');
  });

  it('returns case detail without solution or progressive hints', async () => {
    const response = await authorized('get', `/cases/${caseId}`).expect(200);
    expect(response.body.cells).toHaveLength(4);
    expect(response.body.characters).toHaveLength(2);
    expect(response.body.clues).toHaveLength(1);
    expect(response.body).not.toHaveProperty('solution');
    expect(response.body).not.toHaveProperty('hints');
  });

  it('returns one requested progressive hint', async () => {
    await authorized('get', `/cases/${caseId}/hints?level=2`).expect(200).expect({ level: 2, text: 'Segunda ayuda' });
  });

  it('validates placements against the server-side solution', async () => {
    await authorized('post', `/cases/${caseId}/validate`).send({ positions: [
      { characterId: 'v', x: 0, y: 0 }, { characterId: 's', x: 1, y: 0 },
    ] }).expect(200).expect({ valid: true, killerFound: 's' });

    await authorized('post', `/cases/${caseId}/validate`).send({ positions: [
      { characterId: 'v', x: 0, y: 0 }, { characterId: 's', x: 0, y: 1 },
    ] }).expect(200).expect({ valid: false });
  });

  it('rejects duplicate character IDs in placement submissions', async () => {
    await authorized('post', `/cases/${caseId}/validate`).send({ positions: [
      { characterId: 'v', x: 0, y: 0 }, { characterId: 'v', x: 1, y: 0 },
    ] }).expect(400);
  });
});
