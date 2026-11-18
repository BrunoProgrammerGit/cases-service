import {
  CaseDefinition,
  CaseRecord,
  CaseSummary,
  requiredLevelForDifficulty,
} from '../domain/case.model';
import { DEFAULT_FLOOR_ID } from '../case.constants';
import {
  CaseDto,
  CaseSummaryDto,
  CreateCaseDto,
  ListCasesQueryDto,
  SolutionDto,
} from '../dto/case.dto';
import { CaseFilter, SolutionSubmission } from '../domain/case.model';

export const toSummary = (c: CaseSummary): CaseSummaryDto => ({
  id: c.id,
  title: c.title,
  category: c.category,
  difficulty: c.difficulty,
  requiredLevel: requiredLevelForDifficulty(c.difficulty),
  rows: c.rows,
  columns: c.columns,
});

export const toDetail = (c: CaseRecord): CaseDto => {
  const floorId = c.visuals?.floorId ?? DEFAULT_FLOOR_ID;
  return {
    ...toSummary(c),
    description: c.description,
    visuals: {
      backgroundId: c.visuals?.backgroundId ?? null,
      floorId,
    },
    cells: c.cells.map((cell) => ({
      x: cell.x,
      y: cell.y,
      occupable: cell.occupable,
      type: cell.type,
      name: cell.name,
      roomId: cell.roomId,
      visual: {
        floorId: cell.visual?.floorId ?? floorId,
        obstacleId: cell.visual?.obstacleId ?? null,
      },
    })),
    characters: c.characters.map((character) => ({
      id: character.id,
      name: character.name,
      role: character.role,
      description: character.description,
      visualId: character.visualId ?? null,
      is_victim: character.is_victim,
    })),
    clues: c.clues.map((clue) => ({ ...clue })),
    rooms: (c.rooms ?? []).map((room) => ({ ...room })),
    objects: (c.objects ?? []).map((object) => ({
      ...object,
      cells: object.cells.map((cell) => ({ ...cell })),
    })),
    walls: (c.walls ?? []).map((wall) => ({ ...wall })),
  };
};

export const toCaseDefinition = (dto: CreateCaseDto): CaseDefinition => {
  const solutionId = dto.solution?.murderer_id || dto.solution?.killerId;
  return {
    description: dto.description,
    requiredLevel: dto.requiredLevel,
    title: dto.title,
    category: dto.category,
    difficulty: dto.difficulty,
    rows: dto.rows,
    columns: dto.columns,
    visuals: dto.visuals,
    rooms: dto.rooms?.map((room) => ({ ...room })),
    cells: dto.cells.map((cell) => ({
      ...cell,
      visual: cell.visual ? { ...cell.visual } : cell.visual,
    })),
    characters: dto.characters.map((character) => ({ ...character })),
    clues: dto.clues.map((clue) => ({ ...clue })),
    objects: dto.objects?.map((object) => ({
      ...object,
      cells: object.cells.map((cell) => ({ ...cell })),
    })),
    walls: dto.walls?.map((wall) => ({ ...wall })),
    hints: (dto.hints ?? []).map((hint) => ({ ...hint })),
    solution:
      dto.solution && solutionId
        ? {
            killerId: solutionId,
            positions: dto.solution.positions.map((position) => ({ ...position })),
          }
        : undefined,
  };
};

export const toCaseFilter = (query: ListCasesQueryDto): CaseFilter => {
  const filter: CaseFilter = {};
  if (query.category) {
    filter.category = query.category;
  }
  if (query.difficulty) {
    filter.difficulty = query.difficulty;
  }
  return filter;
};

export const toSolutionSubmission = (dto: SolutionDto): SolutionSubmission => ({
  positions: dto.positions.map((position) => ({ ...position })),
});
