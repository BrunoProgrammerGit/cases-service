import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';
import { Category, Difficulty } from '../schemas/case.schema';

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
}
export class CharacterDto {
  @IsString() @IsNotEmpty()
    id!: string;
  @IsString() @IsNotEmpty()
    name!: string;
  @IsIn(['SUSPECT', 'VICTIM'])
    role!: string;
  @IsOptional() @IsString() description?: string;
}
export class ClueDto {
  @IsString() @IsNotEmpty()
    id!: string;
  @IsString() @IsNotEmpty()
    text!: string;
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
/** Solución completa: solo la envía el administrador al crear el caso. */
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
  @IsArray() @ValidateNested({ each: true }) @Type(() => HintDto)
    hints!: HintDto[];
  @ValidateNested() @Type(() => FullSolutionDto)
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
}
export class ValidationResultDto {
  valid!: boolean;
  killerFound!: boolean;
  correctCount!: number;
  total!: number;
}

export class HintQueryDto {
  @Type(() => Number) // los query params llegan como string; sin esto @IsInt falla siempre
  @IsInt()
  @Min(1)
  level!: number;
}