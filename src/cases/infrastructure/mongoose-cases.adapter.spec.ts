import { Model } from 'mongoose';
import { CaseDefinition, Category, Difficulty } from '../domain/case.model';
import { CaseDocument } from '../schemas/case.schema';
import { MongooseCasesAdapter } from './mongoose-cases.adapter';

describe('MongooseCasesAdapter', () => {
  it('persists and restores the offline-compatible case structure', async () => {
    const id = '507f1f77bcf86cd799439011';
    const definition: CaseDefinition = {
      description: 'Caso offline',
      requiredLevel: 1,
      title: 'Misterio en la biblioteca',
      category: Category.OFICINAS,
      difficulty: Difficulty.EASY,
      rows: 1,
      columns: 2,
      visuals: { backgroundId: 'background.office', floorId: 'floor.soil.center' },
      rooms: [{ id: 'library', name: 'Biblioteca', floorId: 'floor.soil.center' }],
      cells: [
        {
          x: 0,
          y: 0,
          occupable: true,
          type: 'ROOM',
          roomId: 'library',
          visual: { obstacleId: 'obstacle.bookcase' },
        },
        {
          x: 1,
          y: 0,
          occupable: true,
          type: 'ROOM',
          roomId: 'library',
        },
      ],
      characters: [
        { id: 'victim', name: 'Valeria', role: 'VICTIM', is_victim: true },
        { id: 'suspect', name: 'Diego', role: 'SUSPECT' },
      ],
      clues: [
        {
          id: 'clue-1',
          text: 'Una pista',
          scope: 'CHARACTER',
          characterId: 'suspect',
        },
      ],
      objects: [
        {
          id: 'bookcase',
          type: 'BOOKCASE',
          name: 'Estantería',
          visualId: 'obstacle.bookcase',
          cells: [{ x: 0, y: 0 }],
        },
      ],
      walls: [{ x: 0, y: 0, side: 'NORTH' }],
      hints: [],
      solution: {
        killerId: 'suspect',
        positions: [
          { characterId: 'victim', x: 0, y: 0 },
          { characterId: 'suspect', x: 1, y: 0 },
        ],
      },
    };
    const document = {
      ...definition,
      solution: {
        murderer_id: 'suspect',
        positions: definition.solution?.positions,
      },
      _id: id,
    };
    const model = {
      create: jest.fn().mockResolvedValue({ toObject: () => document }),
    } as unknown as Model<CaseDocument>;
    const adapter = new MongooseCasesAdapter(model);

    const result = await adapter.create(definition);

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Caso offline',
        requiredLevel: 1,
        rooms: definition.rooms,
        solution: {
          murderer_id: 'suspect',
          positions: definition.solution.positions,
        },
      }),
    );
    expect(result.rooms).toEqual(definition.rooms);
    expect(result.objects).toEqual(definition.objects);
    expect(result.walls).toEqual(definition.walls);
    expect(result.characters[0].is_victim).toBe(true);
    expect(result.solution?.killerId).toBe('suspect');
  });

  it('explicitly selects the private stored solution only for validation reads', async () => {
    const id = '507f1f77bcf86cd799439011';
    const doc = {
      _id: id,
      title: 'Case',
      category: 'HOGAR',
      difficulty: 'EASY',
      rows: 1,
      columns: 1,
      cells: [],
      characters: [],
      clues: [],
      hints: [],
      solution: { killerId: 'S1', positions: [{ characterId: 'S1', x: 0, y: 0 }] },
    };
    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(doc),
    };
    const model = {
      findById: jest.fn().mockReturnValue(query),
    } as unknown as Model<CaseDocument>;
    const adapter = new MongooseCasesAdapter(model);

    const result = await adapter.findById(id, true);

    expect(model.findById).toHaveBeenCalledWith(id);
    expect(query.select).toHaveBeenCalledWith('+solution');
    expect(result?.id).toBe(id);
    expect(result?.solution).toEqual(doc.solution);
  });
});
