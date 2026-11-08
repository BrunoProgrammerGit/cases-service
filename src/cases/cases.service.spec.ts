import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CasesService } from './cases.service';
import { CaseEntity } from './schemas/case.schema';
import { CreateCaseDto } from './dto/case.dto';

const definition: CreateCaseDto = {
  title: 'Caso de prueba',
  category: 'HOGAR' as CreateCaseDto['category'],
  difficulty: 'MEDIUM' as CreateCaseDto['difficulty'],
  rows: 1,
  columns: 2,
  visuals: { backgroundId: null, floorId: 'floor.grass.plain' },
  cells: [
    {
      x: 0,
      y: 0,
      occupable: true,
      type: 'ROOM',
      visual: { floorId: 'floor.grass.corner.top_left', obstacleId: null },
    },
    {
      x: 1,
      y: 0,
      occupable: true,
      type: 'ROOM',
      visual: {
        floorId: 'floor.grass.center',
        obstacleId: 'obstacle.tree.tile_0028',
      },
    },
  ],
  characters: [
    {
      id: 'personaje-01',
      name: 'Elena Cruz',
      role: 'VICTIM',
      visualId: 'character.woman.tile_0082',
    },
    {
      id: 'personaje-02',
      name: 'Marco Ruiz',
      role: 'SUSPECT',
      visualId: 'character.man.tile_0070',
    },
  ],
  clues: [{ id: 'pista-01', text: 'Una pista' }],
  hints: [{ level: 1, text: 'Una ayuda' }],
  solution: {
    killerId: 'personaje-02',
    positions: [
      { characterId: 'personaje-01', x: 0, y: 0 },
      { characterId: 'personaje-02', x: 1, y: 0 },
    ],
  },
};

describe('CasesService', () => {
  let service: CasesService;
  const model = {
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        { provide: getModelToken(CaseEntity.name), useValue: model },
      ],
    }).compile();
    service = module.get(CasesService);
  });

  it('persists and returns all case visuals on creation', async () => {
    model.create.mockResolvedValue({
      toObject: () => ({ ...definition, _id: 'caso-001' }),
    });

    const result = await service.create(definition);

    expect(model.create).toHaveBeenCalledWith(definition);
    expect(result.visuals).toEqual(definition.visuals);
    expect(result.cells[1].visual).toEqual(definition.cells[1].visual);
    expect(result.characters[0].visualId).toBe('character.woman.tile_0082');
    expect(result).not.toHaveProperty('solution');
    expect(result).not.toHaveProperty('hints');
  });

  it('persists visual changes on edit', async () => {
    const id = '507f1f77bcf86cd799439011';
    const query = {
      lean: jest.fn().mockResolvedValue({ ...definition, _id: id }),
    };
    model.findByIdAndUpdate.mockReturnValue(query);

    const result = await service.update(id, definition);

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      { $set: definition },
      { new: true, runValidators: true },
    );
    expect(result.cells[0].visual?.floorId).toBe('floor.grass.corner.top_left');
    expect(result.characters[1].visualId).toBe('character.man.tile_0070');
  });

  it('projects only summary fields for the case list', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: 'caso-001',
          title: definition.title,
          category: definition.category,
          difficulty: definition.difficulty,
          rows: definition.rows,
          columns: definition.columns,
        },
      ]),
    };
    model.find.mockReturnValue(query);

    const result = await service.findAll({});

    expect(model.find).toHaveBeenCalledWith({});
    expect(query.select).toHaveBeenCalledWith(
      '_id title category difficulty rows columns',
    );
    expect(result[0]).toEqual({
      id: 'caso-001',
      title: definition.title,
      category: definition.category,
      difficulty: definition.difficulty,
      rows: definition.rows,
      columns: definition.columns,
    });
    expect(result[0]).not.toHaveProperty('cells');
  });
});
