import { CaseDefinition, CasePosition } from './case.model';

const OBJECT_TYPES: Record<string, string> = {
  alfombra: 'CARPET', sillon: 'ARMCHAIR', cama: 'BED',
  estanteria: 'BOOKCASE', mesa: 'TABLE', planta: 'PLANT', arbusto: 'BUSH',
  estatua: 'STATUE', carro: 'CAR', televisor: 'TELEVISION', caja: 'BOX',
};

const normalize = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
type Position = { x: number; y: number };
type Constraint = (position: Position) => boolean;

export interface UniquenessResult {
  count: number;
  solution?: CasePosition[];
  unsupportedClues: string[];
}

/** Counts placements matching catalog clue grammar, stopping at two solutions. */
export function countCaseSolutions(definition: CaseDefinition): UniquenessResult {
  const occupable = definition.cells.filter((cell) => cell.occupable);
  const constraints = new Map<string, Constraint[]>();
  const unsupportedClues: string[] = [];
  let allRoomsOccupied = false;

  for (const clue of definition.clues) {
    const text = normalize(clue.text);
    if (clue.scope === 'GENERAL' || (!clue.scope && !clue.characterId)) {
      if (text === 'no hubo ninguna habitacion vacia.') allRoomsOccupied = true;
      else unsupportedClues.push(clue.id);
      continue;
    }
    if (clue.scope !== 'CHARACTER' || !clue.characterId) {
      unsupportedClues.push(clue.id);
      continue;
    }

    let constraint: Constraint | undefined;
    const row = text.match(/^estaba en la fila (\d+)\.?$/);
    const column = text.match(/^estaba en la columna (\d+)\.?$/);
    if (row) constraint = (position) => position.y === Number(row[1]) - 1;
    else if (column) constraint = (position) => position.x === Number(column[1]) - 1;
    else {
      const adjacent = text.match(/^estaba junto a (?:un|una) (.+?)\.?$/);
      const direct = text.match(/^estaba (?:sobre|en) (?:un|una) (.+?)\.?$/);
      if (adjacent || direct) {
        const objectName = (adjacent ? adjacent[1] : direct![1]).replace(/\.$/, '');
        const objectType = OBJECT_TYPES[objectName];
        const objectCells = definition.objects?.filter((object) => object.type === objectType)
          .flatMap((object) => object.cells) ?? [];
        if (objectType && objectCells.length) {
          constraint = adjacent
            ? (position) => objectCells.some((cell) => Math.abs(cell.x - position.x) + Math.abs(cell.y - position.y) === 1)
            : (position) => objectCells.some((cell) => cell.x === position.x && cell.y === position.y);
        }
      }
      if (!constraint) {
        const roomPhrase = text.replace(/^estaba en (?:la|el|los|las) /, '').replace(/\.$/, '');
        const room = definition.rooms?.find((candidate) => normalize(candidate.name) === roomPhrase);
        if (room) constraint = (position) =>
          definition.cells.some((cell) => cell.x === position.x && cell.y === position.y && cell.roomId === room.id);
      }
    }
    if (!constraint) unsupportedClues.push(clue.id);
    else constraints.set(clue.characterId, [...(constraints.get(clue.characterId) ?? []), constraint]);
  }
  if (unsupportedClues.length) return { count: 0, unsupportedClues };

  const roomCells = new Map<string, Set<string>>();
  for (const cell of definition.cells) {
    if (!cell.roomId) continue;
    if (!roomCells.has(cell.roomId)) roomCells.set(cell.roomId, new Set());
    roomCells.get(cell.roomId)!.add(`${cell.x},${cell.y}`);
  }
  const variables = definition.characters.map((character) => ({
    characterId: character.id,
    candidates: occupable.filter((cell) => (constraints.get(character.id) ?? []).every((rule) => rule(cell)))
      .map(({ x, y }) => ({ x, y })),
  })).sort((a, b) => a.candidates.length - b.candidates.length);
  const solutions: CasePosition[][] = [];
  const selected = new Map<string, Position>();
  const rows = new Set<number>();
  const columns = new Set<number>();

  const canStillCoverRooms = (index: number): boolean => !allRoomsOccupied || [...roomCells.values()].every((room) =>
    [...room].some((key) => {
      const [x, y] = key.split(',').map(Number);
      if ([...selected.values()].some((position) => position.x === x && position.y === y)) return true;
      return variables.slice(index).some((variable) =>
        variable.candidates.some((candidate) => candidate.x === x && candidate.y === y));
    }));

  const search = (index: number): void => {
    if (solutions.length >= 2 || !canStillCoverRooms(index)) return;
    if (index === variables.length) {
      if (allRoomsOccupied && [...roomCells.values()].some((room) =>
        ![...selected.values()].some((position) => room.has(`${position.x},${position.y}`)))) return;
      solutions.push([...selected].map(([characterId, position]) => ({ characterId, ...position })));
      return;
    }
    const variable = variables[index];
    for (const candidate of variable.candidates) {
      if (rows.has(candidate.y) || columns.has(candidate.x)) continue;
      selected.set(variable.characterId, candidate);
      rows.add(candidate.y);
      columns.add(candidate.x);
      search(index + 1);
      selected.delete(variable.characterId);
      rows.delete(candidate.y);
      columns.delete(candidate.x);
      if (solutions.length >= 2) return;
    }
  };
  search(0);
  return { count: solutions.length, solution: solutions[0], unsupportedClues };
}

export function validateUniqueCaseSolution(definition: CaseDefinition): string[] {
  const result = countCaseSolutions(definition);
  if (result.unsupportedClues.length) {
    return [`Las pistas no se pueden resolver automáticamente: ${result.unsupportedClues.join(', ')}`];
  }
  if (result.count === 0) return ['Las pistas y las reglas del tablero no admiten ninguna solución'];
  if (result.count > 1) return ['El caso admite más de una solución'];
  const stored = [...(definition.solution?.positions ?? [])]
    .map(({ characterId, x, y }) => `${characterId}:${x},${y}`).sort();
  const computed = [...(result.solution ?? [])]
    .map(({ characterId, x, y }) => `${characterId}:${x},${y}`).sort();
  return JSON.stringify(stored) === JSON.stringify(computed)
    ? []
    : ['La solución configurada no coincide con la única solución deducible de las pistas'];
}
