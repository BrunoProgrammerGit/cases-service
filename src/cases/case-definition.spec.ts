import { SEED_CASES } from './seed/seed-data';
import { CreateCaseDto } from './dto/case.dto';
import { validateCaseDefinition } from './case-definition.validator';
import { toDetail } from './cases.mapper';
import { CasesService } from './cases.service';

const copy = (dto: CreateCaseDto): CreateCaseDto => JSON.parse(JSON.stringify(dto));
const errors = (dto: CreateCaseDto) => validateCaseDefinition(dto);
const board = (rows: number, columns: number): CreateCaseDto => ({
  title: 'Fixture', category: 'HOGAR' as any, difficulty: 'EASY' as any, rows, columns,
  cells: Array.from({ length: rows * columns }, (_, i) => ({ x: i % columns, y: Math.floor(i / columns), occupable: true, type: 'ROOM', roomId: 'room-main' })),
  characters: [{ id: 'v', name: 'Victim', role: 'VICTIM' }, { id: 's', name: 'Suspect', role: 'SUSPECT' }],
  clues: [], hints: [], solution: { killerId: 's', positions: [{ characterId: 'v', x: 0, y: 0 }, { characterId: 's', x: 1, y: 0 }] },
});

describe('case structural model', () => {
  it('accepts all four unchanged legacy seeds', () => {
    expect(SEED_CASES).toHaveLength(4);
    for (const seed of SEED_CASES) expect(errors(seed)).toEqual([]);
  });

  it.each([[9, 9], [6, 8]])('accepts complete %ix%i boards', (rows, columns) => {
    expect(errors(board(rows, columns))).toEqual([]);
  });

  it('allows irregular connected rooms and rejects disconnected regions', () => {
    const dto = board(3, 3);
    dto.cells.forEach((cell) => { cell.roomId = `single-${cell.x}-${cell.y}`; });
    for (const key of ['0,0', '1,0', '1,1']) {
      const [x, y] = key.split(',').map(Number);
      dto.cells.find((cell) => cell.x === x && cell.y === y)!.roomId = 'irregular';
    }
    expect(errors(dto)).toEqual([]);
    dto.cells.find((cell) => cell.x === 1 && cell.y === 0)!.roomId = 'single-bridge';
    expect(errors(dto).some((e) => e.includes('no forma una región conectada'))).toBe(true);
  });

  it('allows multiple typed objects spanning cells and independent occupancy', () => {
    const dto = board(2, 3);
    dto.objects = [
      { id: 'chair', type: 'CHAIR', cells: [{ x: 0, y: 0 }] },
      { id: 'table', type: 'TABLE', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
    ];
    expect(errors(dto)).toEqual([]);
    dto.cells[2].occupable = false;
    dto.solution!.positions[1].x = 2;
    expect(errors(dto).some((e) => e.includes('no ocupable'))).toBe(true);
  });

  it('supports variable character counts, general and character clues, and legacy clues', () => {
    const dto = copy(SEED_CASES[0]);
    dto.characters.push({ id: 'S4', name: 'Extra', role: 'SUSPECT' });
    const extraCell = dto.cells.find((cell) => cell.x === 2 && cell.y === 2)!;
    extraCell.type = 'ROOM';
    extraCell.occupable = true;
    dto.solution!.positions.push({ characterId: 'S4', x: 2, y: 2 });
    dto.clues.push({ id: 'general', text: 'Global', scope: 'GENERAL' });
    dto.clues.push({ id: 'individual', text: 'Personal', scope: 'CHARACTER', characterId: 'S1' });
    expect(errors(dto)).toEqual([]);
  });

  it('rejects duplicated character/clue/object IDs and duplicate solution coordinates', () => {
    const dto = copy(SEED_CASES[0]);
    dto.characters.push({ ...dto.characters[1] });
    dto.clues.push({ ...dto.clues[0] });
    dto.solution!.positions[1].x = dto.solution!.positions[0].x;
    dto.solution!.positions[1].y = dto.solution!.positions[0].y;
    dto.objects = [{ id: 'x', type: 'CHAIR', cells: [{ x: 0, y: 0 }] }, { id: 'x', type: 'BED', cells: [{ x: 1, y: 0 }] }];
    const result = errors(dto).join(' ');
    expect(result).toContain('id de personaje');
    expect(result).toContain('id de pista');
    expect(result).toContain('id de objeto');
    expect(result).toContain('Dos personajes comparten');
  });

  it('represents an internal wall once and rejects duplicate opposite edges', () => {
    const dto = board(2, 2);
    dto.walls = [{ x: 0, y: 0, side: 'EAST' }, { x: 1, y: 0, side: 'WEST' }];
    expect(errors(dto).some((e) => e.includes('está repetido'))).toBe(true);
  });

  it('keeps solution and hints out of public detail mapping', () => {
    const mapped = toDetail({ _id: 'id', ...SEED_CASES[0], solution: { killerId: 'secret', positions: [] } });
    expect(mapped).not.toHaveProperty('solution');
    expect(mapped).not.toHaveProperty('hints');
  });

  it('rejects duplicate submitted IDs before solution comparison', async () => {
    const model: any = { findById: jest.fn() };
    const service = new CasesService(model);
    await expect(service.validate('507f1f77bcf86cd799439011', { positions: [
      { characterId: 'same', x: 0, y: 0 }, { characterId: 'same', x: 1, y: 0 },
    ] })).rejects.toThrow('repite identificadores');
    expect(model.findById).not.toHaveBeenCalled();
  });

  it('uses the private server solution as the authority for submitted positions', async () => {
    const doc = { solution: { killerId: 's', positions: [
      { characterId: 'v', x: 0, y: 0 }, { characterId: 's', x: 1, y: 0 },
    ] } };
    const model: any = { findById: jest.fn(() => ({ select: () => ({ lean: async () => doc }) })) };
    const service = new CasesService(model);
    await expect(service.validate('507f1f77bcf86cd799439011', { positions: [
      { characterId: 'v', x: 0, y: 0 }, { characterId: 's', x: 1, y: 0 },
    ] })).resolves.toEqual({ valid: true, killerFound: 's' });
    await expect(service.validate('507f1f77bcf86cd799439011', { positions: [
      { characterId: 'v', x: 0, y: 0 }, { characterId: 's', x: 2, y: 0 },
    ] })).resolves.toEqual({ valid: false });
  });
});
