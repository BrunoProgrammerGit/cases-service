import { CaseDefinition } from '../domain/case.model';
// The application loads catalog.json. Tests use the same cases as production.
const catalog = require('./catalog.json') as CaseDefinition[];
export const SEED_CASES: CaseDefinition[] = catalog;
