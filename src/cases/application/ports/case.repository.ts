import {
  CaseDefinition,
  CaseFilter,
  CaseRecord,
  CaseSummary,
} from '../../domain/case.model';

export const CASE_REPOSITORY = Symbol('CASE_REPOSITORY');

export interface CaseRepository {
  findAll(filter: CaseFilter): Promise<CaseSummary[]>;
  findById(id: string, includeSolution?: boolean): Promise<CaseRecord | null>;
  findHints(id: string): Promise<CaseDefinition['hints'] | null>;
  create(definition: CaseDefinition): Promise<CaseRecord>;
  update(id: string, definition: CaseDefinition): Promise<CaseRecord | null>;
  remove(id: string): Promise<boolean>;
}
