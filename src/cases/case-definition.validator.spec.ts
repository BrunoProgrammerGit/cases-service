import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { validateCaseDefinition } from './domain/case-definition.policy';
import { CreateCaseDto } from './dto/case.dto';
import { toCaseDefinition } from './http/cases.mapper';

const validateDefinition = (dto: CreateCaseDto) =>
  validateCaseDefinition(toCaseDefinition(dto));

const validCase = (): CreateCaseDto => ({
  title: 'Caso de prueba',
  category: 'HOGAR' as CreateCaseDto['category'],
  difficulty: 'MEDIUM' as CreateCaseDto['difficulty'],
  rows: 2,
  columns: 2,
  visuals: { backgroundId: null, floorId: 'floor.grass.plain' },
  cells: [
    {
      x: 0,
      y: 0,
      occupable: true,
      type: 'ROOM',
      visual: { obstacleId: 'obstacle.tree.tile_0028' },
    },
    { x: 1, y: 0, occupable: false, type: 'FIXED_OBJECT' },
    { x: 0, y: 1, occupable: true, type: 'ROOM' },
    { x: 1, y: 1, occupable: false, type: 'EMPTY' },
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
      { characterId: 'personaje-02', x: 0, y: 1 },
    ],
  },
});

describe('validateCaseDefinition', () => {
  it('accepts a complete grid and keeps an occupable cell occupable despite its obstacle', () => {
    const definition = validCase();

    expect(validateDefinition(definition)).toEqual([]);
    expect(definition.cells[0].occupable).toBe(true);
    expect(definition.cells[0].visual?.obstacleId).toBe(
      'obstacle.tree.tile_0028',
    );
  });

  it('rejects missing, duplicate, and out-of-bounds coordinates', () => {
    const definition = validCase();
    definition.cells = [
      ...definition.cells.slice(0, 2),
      { x: 2, y: 1, occupable: false, type: 'EMPTY' },
      { x: 0, y: 0, occupable: true, type: 'ROOM' },
    ];

    const errors = validateDefinition(definition);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('repetida'),
        expect.stringContaining('fuera del tablero'),
        expect.stringContaining('Falta la casilla (1,1)'),
      ]),
    );
  });

  it('rejects a grid with fewer cells than its dimensions require', () => {
    const definition = validCase();
    definition.cells.pop();

    expect(validateDefinition(definition)).toContain(
      'El tablero debe tener exactamente 4 casillas (hay 3)',
    );
  });

  it('rejects dimensions above the supported limit and visual IDs outside the client catalog', () => {
    const definition = validCase();
    definition.rows = 21;
    definition.visuals = { floorId: 'floor.not-real' };
    definition.cells[0].visual = { obstacleId: 'obstacle.not-real' };
    definition.characters[0].visualId = 'character.not-real';

    const errors = validateDefinition(definition);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('dimensiones'),
        expect.stringContaining('piso predeterminado'),
        expect.stringContaining('obstáculo'),
        expect.stringContaining('retrato'),
      ]),
    );
  });

  it('rejects repeated character IDs and names', () => {
    const definition = validCase();
    definition.characters[1].id = definition.characters[0].id;
    definition.characters[1].name = ' elena cruz ';

    const errors = validateDefinition(definition);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('id de personaje'),
        expect.stringContaining('nombre de personaje'),
      ]),
    );
  });

  it('validates nested visual DTO fields against catalog IDs', async () => {
    const definition = validCase();
    expect(
      await validate(plainToInstance(CreateCaseDto, definition)),
    ).toHaveLength(0);

    definition.characters[0].visualId = 'character.not-in-catalog';
    const errors = await validate(plainToInstance(CreateCaseDto, definition));
    expect(
      errors.find((error) => error.property === 'characters')?.children?.length,
    ).toBeGreaterThan(0);
  });

  it('accepts offline-case structures and murderer_id without requiring hints', async () => {
    const definition = validCase();
    definition.rooms = [
      { id: 'room-1', name: 'Biblioteca', floorId: 'floor.soil.center' },
    ];
    definition.cells
      .filter((cell) => cell.type === 'ROOM')
      .forEach((cell) => {
        cell.roomId = 'room-1';
      });
    definition.walls = [{ x: 0, y: 0, side: 'NORTH' }];
    definition.objects = [
      {
        id: 'bookcase-1',
        type: 'BOOKCASE',
        name: 'Estantería',
        visualId: 'obstacle.bookcase',
        cells: [{ x: 0, y: 0 }],
      },
    ];
    definition.characters[0].is_victim = true;
    definition.clues = [
      { id: 'general-1', scope: 'GENERAL', text: 'Una pista general.' },
      {
        id: 'character-1',
        scope: 'CHARACTER',
        characterId: 'personaje-02',
        text: 'Una pista personal.',
      },
    ];
    delete definition.hints;
    if (definition.solution) {
      definition.solution = {
        murderer_id: definition.solution.killerId,
        positions: definition.solution.positions,
      };
    }

    const dto = plainToInstance(CreateCaseDto, definition);

    expect(await validate(dto)).toHaveLength(0);
    expect(validateDefinition(dto)).toEqual([]);
  });
});
