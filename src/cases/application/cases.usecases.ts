import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CaseDefinition,
  CaseFilter,
  CaseRecord,
  CaseSummary,
  SolutionSubmission,
  SolutionValidationResult,
} from '../domain/case.model';
import { isValidCaseId } from '../domain/case-id.policy';
import { validateCaseDefinition } from '../domain/case-definition.policy';
import { validateSolution } from '../domain/case-solution.policy';
import { CASE_REPOSITORY } from './ports/case.repository';
import type { CaseRepository } from './ports/case.repository';

@Injectable()
export class CasesUseCases {
  constructor(
    @Inject(CASE_REPOSITORY) private readonly cases: CaseRepository,
  ) {}

  findAll(filter: CaseFilter): Promise<CaseSummary[]> {
    return this.cases.findAll(filter);
  }

  async findOne(id: string): Promise<CaseRecord> {
    this.assertId(id);
    const result = await this.cases.findById(id);
    if (!result) {
      throw new NotFoundException(`Caso ${id} no existe`);
    }
    return result;
  }

  async getHint(id: string, level: number): Promise<CaseRecord['hints'][number]> {
    this.assertId(id);
    const hints = await this.cases.findHints(id);
    if (!hints) {
      throw new NotFoundException(`Caso ${id} no existe`);
    }

    const hint = hints.find((item) => item.level === level);
    if (!hint) {
      const max = Math.max(0, ...hints.map((item) => item.level));
      throw new NotFoundException(`No hay pista de nivel ${level}. Niveles disponibles: 1 a ${max}`);
    }
    return hint;
  }

  async create(definition: CaseDefinition): Promise<CaseRecord> {
    this.assertConsistent(definition);
    return this.cases.create(definition);
  }

  async update(id: string, definition: CaseDefinition): Promise<CaseRecord> {
    this.assertId(id);
    this.assertConsistent(definition);
    const result = await this.cases.update(id, definition);
    if (!result) {
      throw new NotFoundException(`Caso ${id} no existe`);
    }
    return result;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    this.assertId(id);
    if (!(await this.cases.remove(id))) {
      throw new NotFoundException(`Caso ${id} no existe`);
    }
    return { deleted: true };
  }

  async validate(id: string, submission: SolutionSubmission): Promise<SolutionValidationResult> {
    this.assertId(id);
    const submittedIds = submission.positions.map((position) => position.characterId);
    if (new Set(submittedIds).size !== submittedIds.length) {
      throw new BadRequestException('La petición repite identificadores de personaje');
    }

    const result = await this.cases.findById(id, true);
    if (!result) {
      throw new NotFoundException(`Caso ${id} no existe`);
    }
    if (!result.solution) {
      throw new BadRequestException('El caso no tiene una solución configurada');
    }
    return validateSolution(result.solution, submission);
  }

  private assertId(id: string): void {
    if (!isValidCaseId(id)) {
      throw new BadRequestException(`Id inválido: ${id}`);
    }
  }

  private assertConsistent(definition: CaseDefinition): void {
    const errors = validateCaseDefinition(definition, true);
    if (errors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'El caso no es consistente',
        errors,
      });
    }
  }
}
