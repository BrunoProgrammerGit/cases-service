import { CaseDto, CaseSummaryDto } from './dto/case.dto';

export const toSummary = (c: any): CaseSummaryDto => ({
  id: String(c._id),
  title: c.title,
  category: c.category,
  difficulty: c.difficulty,
  rows: c.rows,
  columns: c.columns,
});

export const toDetail = (c: any): CaseDto => ({
  ...toSummary(c),
  cells: c.cells,
  characters: c.characters,
  clues: c.clues,
});