import { BadRequestException } from '@nestjs/common';
import { CaseRepository } from './ports/case.repository';
import { CasesUseCases } from './cases.usecases';
import { CaseDefinition, CaseRecord, Category, Difficulty } from '../domain/case.model';

const definition: CaseDefinition = {
  title: 'Caso de prueba',
  category: Category.HOGAR,
  difficulty: Difficulty.MEDIUM,
  rows: 2,
  columns: 2,
  visuals: { backgroundId: null, floorId: 'floor.grass.plain' },
  cells: [
    { x: 0, y: 0, occupable: true, type: 'ROOM', visual: { floorId: 'floor.grass.corner.top_left' } },
    { x: 1, y: 0, occupable: true, type: 'ROOM', visual: { floorId: 'floor.grass.center' } },
    { x: 0, y: 1, occupable: true, type: 'ROOM', visual: { floorId: 'floor.grass.center' } },
    { x: 1, y: 1, occupable: true, type: 'ROOM', visual: { floorId: 'floor.grass.center' } },
  ],
  characters: [
    { id: 'personaje-01', name: 'Elena Cruz', role: 'VICTIM', visualId: 'character.woman.tile_0082' },
    { id: 'personaje-02', name: 'Marco Ruiz', role: 'SUSPECT', visualId: 'character.man.tile_0070' },
  ],
  clues: [
    { id: 'pista-victima-fila', text: 'Estaba en la fila 1.', scope: 'CHARACTER', characterId: 'personaje-01' },
    { id: 'pista-victima-columna', text: 'Estaba en la columna 1.', scope: 'CHARACTER', characterId: 'personaje-01' },
    { id: 'pista-sospechoso-fila', text: 'Estaba en la fila 2.', scope: 'CHARACTER', characterId: 'personaje-02' },
    { id: 'pista-sospechoso-columna', text: 'Estaba en la columna 2.', scope: 'CHARACTER', characterId: 'personaje-02' },
  ],
  hints: [{ level: 1, text: 'Una ayuda' }],
  solution: {
    killerId: 'personaje-02',
    positions: [
      { characterId: 'personaje-01', x: 0, y: 0 },
      { characterId: 'personaje-02', x: 1, y: 1 },
    ],
  },
};

describe('CasesUseCases', () => {
  let useCases: CasesUseCases;
  const cases: jest.Mocked<CaseRepository> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findHints: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCases = new CasesUseCases(cases);
  });

  it('creates a consistent case through the repository port', async () => {
    const record: CaseRecord = { id: '507f1f77bcf86cd799439011', ...definition };
    cases.create.mockResolvedValue(record);

    const result = await useCases.create(definition);

    expect(cases.create).toHaveBeenCalledWith(definition);
    expect(result.id).toBe(record.id);
    expect(result.visuals).toEqual(definition.visuals);
  });

  it('rejects invalid case definitions without persisting', async () => {
    const invalid = { ...definition, rows: 0 };

    await expect(useCases.create(invalid)).rejects.toBeInstanceOf(BadRequestException);

    expect(cases.create).not.toHaveBeenCalled();
  });

  it('updates existing cases through the repository port', async () => {
    const id = '507f1f77bcf86cd799439011';
    const record: CaseRecord = { id, ...definition };
    cases.update.mockResolvedValue(record);

    const result = await useCases.update(id, definition);

    expect(cases.update).toHaveBeenCalledWith(id, definition);
    expect(result.cells[0].visual?.floorId).toBe('floor.grass.corner.top_left');
    expect(result.characters[1].visualId).toBe('character.man.tile_0070');
  });
});
