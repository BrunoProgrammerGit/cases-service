import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsDefined, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateIf, ValidateNested,
} from 'class-validator';
import { Category, Difficulty } from '../schemas/case.schema';


export class CellVisualDto {
  @IsOptional() @IsString() floorId?: string;
  @IsOptional() @IsString() obstacleId?: string | null;
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
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() @IsNotEmpty() roomId?: string;
  @IsOptional() @ValidateNested() @Type(() => CellVisualDto) visual?: CellVisualDto;
}
export class CaseVisualsDto {
  @IsOptional() @IsString() backgroundId?: string;
  @IsOptional() @IsString() floorId?: string;
}
export class CaseObjectDto {
  @IsString() @IsNotEmpty() id!: string;
  @IsString() @IsNotEmpty() type!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ObjectCellDto) cells!: ObjectCellDto[];
  @IsOptional() @IsString() name?: string;
}
export class ObjectCellDto {
  @IsInt() @Min(0) x!: number;
  @IsInt() @Min(0) y!: number;
}
export class WallDto {
  @IsInt() @Min(0) x!: number;
  @IsInt() @Min(0) y!: number;
  @IsIn(['NORTH', 'EAST', 'SOUTH', 'WEST']) side!: string;
}
export class CharacterDto {
  @IsString() @IsNotEmpty()
  id!: string;
  @IsString() @IsNotEmpty()
  name!: string;
  @IsIn(['SUSPECT', 'VICTIM'])
  role!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() visualId?: string;
}
export class ClueDto {
  @IsString() @IsNotEmpty()
  id!: string;
  @IsString() @IsNotEmpty()
  text!: string;
  @IsOptional() @IsIn(['GENERAL', 'CHARACTER']) scope?: string;
  @ValidateIf((o: ClueDto) => o.scope === 'CHARACTER' || o.characterId !== undefined)
  @IsString() @IsNotEmpty() characterId?: string;
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
  @IsString() @IsNotEmpty()
  killerId!: string;
}

export class CreateCaseDto {
  @IsString() @IsNotEmpty()
  title!: string;
  @IsEnum(Category)
  category!: Category;
  @IsEnum(Difficulty)
  difficulty!: Difficulty;
  @IsInt() @Min(1)
  rows!: number;
  @IsInt() @Min(1)
  columns!: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CellDto)
  cells!: CellDto[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => CharacterDto)
  characters!: CharacterDto[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => ClueDto)
  clues!: ClueDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CaseObjectDto) objects?: CaseObjectDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => WallDto) walls?: WallDto[];
  @IsOptional() @ValidateNested() @Type(() => CaseVisualsDto) visuals?: CaseVisualsDto;
  @IsArray() @ValidateNested({ each: true }) @Type(() => HintDto)
  hints!: HintDto[];
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
}
export class CaseDto extends CaseSummaryDto {
  cells!: CellDto[];
  characters!: CharacterDto[];
  clues!: ClueDto[];
  objects?: CaseObjectDto[];
  walls?: WallDto[];
  visuals?: CaseVisualsDto;
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
