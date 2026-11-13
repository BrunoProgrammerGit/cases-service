import { toDetail, toSummary } from './cases.mapper';
import { DEFAULT_FLOOR_ID } from './case.constants';
import { Category, Difficulty } from './schemas/case.schema';

const caseDocument = {
  _id: 'caso-001',
  title: 'Misterio en la finca',
  category: Category.HOGAR,
  difficulty: Difficulty.MEDIUM,
  rows: 1,
  columns: 2,
  visuals: { backgroundId: null, floorId: 'floor.grass.plain' },
  cells: [
    {
      x: 0,
      y: 0,
      occupable: true,
      type: 'ROOM',
      name: 'Patio',
      visual: { floorId: 'floor.grass.corner.top_left', obstacleId: null },
    },
    {
      x: 1,
      y: 0,
      occupable: false,
      type: 'FIXED_OBJECT',
      name: 'Árbol',
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
      role: 'SUSPECT',
      description: 'Testigo del caso',
      visualId: 'character.woman.tile_0082',
    },
  ],
  clues: [{ id: 'pista-01', text: 'Una pista' }],
  hints: [{ level: 1, text: 'Una pista protegida' }],
  solution: { killerId: 'personaje-01' },
};

describe('case mappers', () => {
  it('maps the complete public detail while preserving cell flags and visual references', () => {
    const detail = toDetail(caseDocument);

    expect(detail).toMatchObject({
      id: 'caso-001',
      rows: 1,
      columns: 2,
      visuals: { backgroundId: null, floorId: 'floor.grass.plain' },
      cells: caseDocument.cells,
      characters: caseDocument.characters,
      clues: caseDocument.clues,
    });
    expect(detail.cells).toHaveLength(detail.rows * detail.columns);
    expect(detail.cells[0].occupable).toBe(true);
    expect(detail.cells[1].occupable).toBe(false);
    expect(detail).not.toHaveProperty('solution');
    expect(detail).not.toHaveProperty('killerId');
    expect(detail).not.toHaveProperty('hints');
  });

  it('returns compatible defaults for legacy documents without visual references', () => {
    const legacyDetail = toDetail({
      ...caseDocument,
      visuals: undefined,
      cells: [{ x: 0, y: 0, occupable: true, type: 'ROOM', name: 'Sala' }],
      characters: [{ id: 'V1', name: 'Elena', role: 'VICTIM' }],
    });

    expect(legacyDetail.visuals).toEqual({
      backgroundId: null,
      floorId: DEFAULT_FLOOR_ID,
    });
    expect(legacyDetail.cells[0].visual).toEqual({
      floorId: DEFAULT_FLOOR_ID,
      obstacleId: null,
    });
    expect(legacyDetail.characters[0].visualId).toBeNull();
  });

  it('keeps list responses limited to summary fields', () => {
    const summary = toSummary(caseDocument);

    expect(summary).toEqual({
      id: 'caso-001',
      title: 'Misterio en la finca',
      category: 'HOGAR',
      difficulty: 'MEDIUM',
      rows: 1,
      columns: 2,
    });
    expect(summary).not.toHaveProperty('cells');
    expect(summary).not.toHaveProperty('characters');
    expect(summary).not.toHaveProperty('visuals');
  });
});
