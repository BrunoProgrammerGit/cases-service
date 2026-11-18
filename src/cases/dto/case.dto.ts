import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsDefined, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min, ValidateNested,
} from 'class-validator';
import { Category, Difficulty } from '../schemas/case.schema';
import { MAX_BOARD_DIMENSION } from '../case.constants';
import { BACKGROUND_IDS, CHARACTER_VISUAL_IDS, FLOOR_IDS, OBSTACLE_IDS } from '../visual-catalog';

export class CellVisualDto {
  @IsOptional() @IsString() @IsIn(FLOOR_IDS)
  floorId?: string | null;
  @IsOptional() @IsString() @IsIn(OBSTACLE_IDS)
  obstacleId?: string | null;
}

export class CaseVisualsDto {
  @IsOptional() @IsString() @IsIn(BACKGROUND_IDS)
  backgroundId?: string | null;
  @IsOptional() @IsString() @IsIn(FLOOR_IDS)
  floorId?: string | null;
}

export class CellDto {
  @IsInt() @Min(0)
  x!: number;
  @IsInt() @Min(0)
  y!: number;
  @IsBoolean()
  occupable!: boolean;
  @IsIn(['ROOM', 'FIXED_OBJECT', 'EMPTY'])
  type!: string;
  @IsOptional() @IsString() @Matches(/\S/) roomId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @ValidateNested() @Type(() => CellVisualDto)
  visual?: CellVisualDto | null;
}
export class RoomDto {
  @IsString() @IsNotEmpty()
  id!: string;
  @IsString() @IsNotEmpty()
  name!: string;
  @IsOptional() @IsString() @IsIn(FLOOR_IDS)
  floorId?: string | null;
}
export class WallDto {
  @IsInt() @Min(0)
  x!: number;
  @IsInt() @Min(0)
  y!: number;
  @IsIn(['NORTH', 'SOUTH', 'EAST', 'WEST'])
  side!: string;
}
export class ObjectCellDto {
  @IsInt() @Min(0)
  x!: number;
  @IsInt() @Min(0)
  y!: number;
}
export class CaseObjectDto {
  @IsString() @IsNotEmpty()
  id!: string;
  @IsString() @IsNotEmpty()
  type!: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() @IsIn(OBSTACLE_IDS)
  visualId?: string | null;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ObjectCellDto)
  cells!: ObjectCellDto[];
}
export class CharacterDto {
  @IsString() @Matches(/\S/)
  id!: string;
  @IsString() @Matches(/\S/)
  name!: string;
  @IsIn(['SUSPECT', 'VICTIM'])
  role!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @IsIn(CHARACTER_VISUAL_IDS)
  visualId?: string | null;
  @IsOptional() @IsBoolean() is_victim?: boolean;
}
export class ClueDto {
  @IsString() @IsNotEmpty()
  id!: string;
  @IsString() @IsNotEmpty()
  text!: string;
  @IsOptional() @IsIn(['GENERAL', 'CHARACTER'])
  scope?: string;
  @IsOptional() @IsString() @Matches(/\S/)
  characterId?: string;
}
export class HintDto {
  @IsInt() @Min(1)
  level!: number;
  @IsString() @IsNotEmpty()
  text!: string;
}
export class PositionDto {
  @IsString() @IsNotEmpty()
  characterId!: string;
  @IsInt() @Min(0)
  x!: number;
  @IsInt() @Min(0)
  y!: number;
}

/** Lo que envía el jugador al validar. */
export class SolutionDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => PositionDto)
  positions!: PositionDto[];
}

export class FullSolutionDto extends SolutionDto {
  @IsOptional() @IsString() @IsNotEmpty()
  killerId?: string;
  @IsOptional() @IsString() @IsNotEmpty()
  murderer_id?: string;
}

export class CreateCaseDto {
  @IsOptional() @IsString()
  description?: string;
  @IsString() @IsNotEmpty()
  title!: string;
  @IsEnum(Category)
  category!: Category;
  @IsEnum(Difficulty)
  difficulty!: Difficulty;
  @IsInt() @Min(1) @Max(MAX_BOARD_DIMENSION)
  rows!: number;
  @IsInt() @Min(1) @Max(MAX_BOARD_DIMENSION)
  columns!: number;
  @IsOptional() @IsInt() @Min(1)
  requiredLevel?: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CellDto)
  cells!: CellDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RoomDto)
  rooms?: RoomDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => WallDto)
  walls?: WallDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CaseObjectDto)
  objects?: CaseObjectDto[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => CharacterDto)
  characters!: CharacterDto[];
  @IsOptional() @ValidateNested() @Type(() => CaseVisualsDto)
  visuals?: CaseVisualsDto | null;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ClueDto)
  clues!: ClueDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => HintDto)
  hints?: HintDto[];
  @IsDefined() @ValidateNested() @Type(() => FullSolutionDto)
  solution?: FullSolutionDto;
}

export class ListCasesQueryDto {
  @IsOptional() @IsEnum(Category) category?: Category;
  @IsOptional() @IsEnum(Difficulty) difficulty?: Difficulty;
}

/** Salidas (nunca incluyen `solution`). */
export class CaseSummaryDto {
  id!: string;
  title!: string;
  category!: Category;
  difficulty!: Difficulty;
  rows!: number;
  columns!: number;
  requiredLevel!: number;
}
export class CaseDto extends CaseSummaryDto {
  description?: string;
  visuals!: CaseVisualsDto;
  cells!: CellDto[];
  rooms!: RoomDto[];
  walls!: WallDto[];
  objects!: CaseObjectDto[];
  characters!: CharacterDto[];
  clues!: ClueDto[];
}

export class ValidationResultDto {
  valid!: boolean;
  killerFound?: string;
}

export class HintQueryDto {
  @Type(() => Number) // los query params llegan como string; sin esto @IsInt falla siempre
  @IsInt()
  @Min(1)
  level!: number;
}