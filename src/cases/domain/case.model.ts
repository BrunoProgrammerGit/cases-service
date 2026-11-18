export enum Category {
  HOGAR = 'HOGAR',
  OFICINAS = 'OFICINAS',
  TRABAJO = 'TRABAJO',
  TURISTICO = 'TURISTICO',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export const requiredLevelForDifficulty = (difficulty: Difficulty): number =>
  difficulty === Difficulty.EASY ? 1 : difficulty === Difficulty.MEDIUM ? 5 : 10;

export interface CasePosition {
  characterId: string;
  x: number;
  y: number;
}

export interface CaseSolution {
  killerId: string;
  positions: CasePosition[];
}

export interface CaseDefinition {
  description?: string;
  requiredLevel?: number;
  title: string;
  category: Category;
  difficulty: Difficulty;
  rows: number;
  columns: number;
  rooms?: Array<{
    id: string;
    name: string;
    floorId?: string | null;
  }>;
  visuals?: {
    backgroundId?: string | null;
    floorId?: string | null;
  } | null;
  cells: Array<{
    x: number;
    y: number;
    occupable: boolean;
    type: string;
    name?: string;
    roomId?: string;
    visual?: {
      floorId?: string | null;
      obstacleId?: string | null;
    } | null;
  }>;
  characters: Array<{
    id: string;
    name: string;
    role: string;
    description?: string;
    visualId?: string | null;
    is_victim?: boolean;
  }>;
  clues: Array<{
    id: string;
    text: string;
    scope?: string;
    characterId?: string;
  }>;
  objects?: Array<{
    id: string;
    type: string;
    cells: Array<{ x: number; y: number }>;
    name?: string;
    visualId?: string | null;
  }>;
  walls?: Array<{
    x: number;
    y: number;
    side: string;
  }>;
  hints: Array<{ level: number; text: string }>;
  solution?: CaseSolution;
}

export interface CaseRecord extends CaseDefinition {
  id: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  rows: number;
  columns: number;
}

export interface CaseFilter {
  category?: Category;
  difficulty?: Difficulty;
}

export interface SolutionSubmission {
  positions: CasePosition[];
}

export interface SolutionValidationResult {
  valid: boolean;
  killerFound?: string;
}
