import { CaseDto, CaseSummaryDto } from './dto/case.dto';
import { DEFAULT_FLOOR_ID } from './case.constants';
import { Category, Difficulty } from './schemas/case.schema';

export interface CaseMapperInput {
  _id: unknown;
  title: string;
  category: Category;
  difficulty: Difficulty;
  rows: number;
  columns: number;
  description?: string;
  requiredLevel?: number;
  visuals?: {
    backgroundId?: string | null;
    floorId?: string | null;
  } | null;
  cells: Array<{
    x: number;
    y: number;
    occupable: boolean;
    type: string;
    roomId?: string;
    name?: string;
    visual?: {
      floorId?: string | null;
      obstacleId?: string | null;
    } | null;
  }>;
  rooms?: CaseDto['rooms'];
  walls?: CaseDto['walls'];
  objects?: CaseDto['objects'];
  characters: Array<{
    id: string;
    name: string;
    role: string;
    description?: string;
    visualId?: string | null;
    is_victim?: boolean;
  }>;
  clues: CaseDto['clues'];
}

export const toSummary = (c: CaseMapperInput): CaseSummaryDto => ({
  id: String(c._id),
  title: c.title,
  category: c.category,
  difficulty: c.difficulty,
  rows: c.rows,
  columns: c.columns,
  requiredLevel: c.requiredLevel ?? 1,
});

export const toDetail = (c: CaseMapperInput): CaseDto => {
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
      roomId: cell.roomId,
      name: cell.name,
      visual: {
        floorId: cell.visual?.floorId ?? floorId,
        obstacleId: cell.visual?.obstacleId ?? null,
      },
    })),
    rooms: c.rooms ?? [],
    walls: c.walls ?? [],
    objects: c.objects ?? [],
    characters: c.characters.map((character) => ({
      id: character.id,
      name: character.name,
      role: character.role,
      description: character.description,
      visualId: character.visualId ?? null,
      is_victim: character.is_victim,
    })),
    clues: c.clues,
  };
};
