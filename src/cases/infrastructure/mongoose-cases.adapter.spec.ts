import { Model } from 'mongoose';
import { CaseDocument } from '../schemas/case.schema';
import { MongooseCasesAdapter } from './mongoose-cases.adapter';

describe('MongooseCasesAdapter', () => {
  it('explicitly selects the private stored solution only for validation reads', async () => {
    const id = '507f1f77bcf86cd799439011';
    const doc = {
      _id: id,
      title: 'Case',
      category: 'HOGAR',
      difficulty: 'EASY',
      rows: 1,
      columns: 1,
      cells: [],
      characters: [],
      clues: [],
      hints: [],
      solution: { killerId: 'S1', positions: [{ characterId: 'S1', x: 0, y: 0 }] },
    };
    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(doc),
    };
    const model = {
      findById: jest.fn().mockReturnValue(query),
    } as unknown as Model<CaseDocument>;
    const adapter = new MongooseCasesAdapter(model);

    const result = await adapter.findById(id, true);

    expect(model.findById).toHaveBeenCalledWith(id);
    expect(query.select).toHaveBeenCalledWith('+solution');
    expect(result?.id).toBe(id);
    expect(result?.solution).toEqual(doc.solution);
  });
});
