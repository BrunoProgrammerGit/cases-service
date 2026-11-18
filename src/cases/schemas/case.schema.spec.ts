import mongoose from 'mongoose';
import { CaseEntity, CaseSchema } from './case.schema';

describe('CaseSchema visual fields', () => {
  it('casts and retains embedded visual references with compatible defaults', () => {
    const model = mongoose.model('CaseVisualPersistenceSpec', CaseSchema);
    const document = new model({
      title: 'Caso visual',
      category: 'HOGAR',
      difficulty: 'MEDIUM',
      rows: 1,
      columns: 1,
      description: 'Una descripción',
      requiredLevel: 2,
      rooms: [{ id: 'room-1', name: 'Patio', floorId: 'floor.grass.plain' }],
      walls: [{ x: 0, y: 0, side: 'NORTH' }],
      objects: [
        {
          id: 'object-1',
          type: 'TABLE',
          name: 'Mesa',
          visualId: 'obstacle.table.double',
          cells: [{ x: 0, y: 0 }],
        },
      ],
      cells: [
        {
          x: 0,
          y: 0,
          occupable: true,
          type: 'ROOM',
          visual: { floorId: 'floor.grass.corner.top_left', obstacleId: null },
        },
      ],
      characters: [
        {
          id: 'personaje-01',
          name: 'Elena Cruz',
          role: 'SUSPECT',
          visualId: 'character.woman.tile_0082',
          is_victim: true,
        },
      ],
      clues: [
        {
          id: 'clue-1',
          scope: 'CHARACTER',
          characterId: 'personaje-01',
          text: 'Una pista',
        },
      ],
      solution: {
        murderer_id: 'personaje-02',
        positions: [{ characterId: 'personaje-01', x: 0, y: 0 }],
      },
    });

    expect(document.validateSync()).toBeUndefined();
    expect(document.toObject()).toMatchObject({
      visuals: { backgroundId: null, floorId: 'floor.grass.plain' },
      cells: [
        {
          visual: { floorId: 'floor.grass.corner.top_left', obstacleId: null },
        },
      ],
      characters: [{ visualId: 'character.woman.tile_0082' }],
      description: 'Una descripción',
      requiredLevel: 2,
      rooms: [{ id: 'room-1', name: 'Patio', floorId: 'floor.grass.plain' }],
      walls: [{ x: 0, y: 0, side: 'NORTH' }],
      objects: [
        {
          id: 'object-1',
          visualId: 'obstacle.table.double',
          cells: [{ x: 0, y: 0 }],
        },
      ],
      clues: [
        {
          scope: 'CHARACTER',
          characterId: 'personaje-01',
        },
      ],
      solution: {
        murderer_id: 'personaje-02',
        positions: [{ characterId: 'personaje-01', x: 0, y: 0 }],
      },
    });
  });

  it('rejects visual references not present in the client catalog', () => {
    const model = mongoose.model<CaseEntity>(
      'CaseVisualValidationSpec',
      CaseSchema,
    );
    const document = new model({
      title: 'Caso visual',
      category: 'HOGAR',
      difficulty: 'MEDIUM',
      rows: 1,
      columns: 1,
      visuals: { floorId: 'floor.invalid' },
      cells: [
        {
          x: 0,
          y: 0,
          occupable: true,
          type: 'ROOM',
          visual: { obstacleId: 'obstacle.invalid' },
        },
      ],
      characters: [
        {
          id: 'personaje-01',
          name: 'Elena Cruz',
          role: 'SUSPECT',
          visualId: 'character.invalid',
        },
      ],
    });

    const error = document.validateSync();

    expect(error?.errors['visuals.floorId']).toBeDefined();
    expect(error?.errors['cells.0.visual.obstacleId']).toBeDefined();
    expect(error?.errors['characters.0.visualId']).toBeDefined();
  });
});
