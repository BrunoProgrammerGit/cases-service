import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaseRepository } from '../application/ports/case.repository';
import {
  CaseDefinition,
  CaseFilter,
  CasePosition,
  CaseRecord,
  CaseSolution,
  CaseSummary,
  requiredLevelForDifficulty,
} from '../domain/case.model';
import { CaseDocument, CaseEntity } from '../schemas/case.schema';

type PersistedCase = Omit<CaseDefinition, 'solution'> & {
  _id: Types.ObjectId | string;
  solution?: {
    killerId?: string;
    murderer_id?: string;
    positions: CasePosition[];
  };
};
type PersistedSummary = Omit<CaseSummary, 'id'> & { _id: Types.ObjectId | string };

@Injectable()
export class MongooseCasesAdapter implements CaseRepository {
  constructor(
    @InjectModel(CaseEntity.name) private readonly model: Model<CaseDocument>,
  ) {}

  async findAll(filter: CaseFilter): Promise<CaseSummary[]> {
    const docs = await this.model
      .find(filter)
      .select('_id title category difficulty rows columns')
      .lean<PersistedSummary[]>()
      .exec();
    return docs.map((doc) => ({
      id: String(doc._id),
      title: doc.title,
      category: doc.category,
      difficulty: doc.difficulty,
      rows: doc.rows,
      columns: doc.columns,
    }));
  }

  async findById(id: string, includeSolution = false): Promise<CaseRecord | null> {
    const query = this.model.findById(id);
    if (includeSolution) {
      query.select('+solution');
    }
    const doc = await query.lean<PersistedCase>().exec();
    return doc ? this.toRecord(doc) : null;
  }

  async findHints(id: string): Promise<CaseDefinition['hints'] | null> {
    const doc = await this.model
      .findById(id)
      .select('hints')
      .lean<{ hints: CaseDefinition['hints'] }>()
      .exec();
    return doc?.hints ?? null;
  }

  async create(definition: CaseDefinition): Promise<CaseRecord> {
    const created = await this.model.create(this.toPersistence(definition));
    return this.toRecord(created.toObject());
  }

  async update(id: string, definition: CaseDefinition): Promise<CaseRecord | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: this.toPersistence(definition) }, { new: true, runValidators: true })
      .lean<PersistedCase>()
      .exec();
    return doc ? this.toRecord(doc) : null;
  }

  async remove(id: string): Promise<boolean> {
    return (await this.model.findByIdAndDelete(id).exec()) !== null;
  }

  private toRecord(doc: PersistedCase): CaseRecord {
    const killerId = doc.solution?.murderer_id ?? doc.solution?.killerId;
    const solution: CaseSolution | undefined =
      doc.solution && killerId
        ? { killerId, positions: doc.solution.positions }
        : undefined;
    return {
      id: String(doc._id),
      description: doc.description,
      requiredLevel: doc.requiredLevel,
      title: doc.title,
      category: doc.category,
      difficulty: doc.difficulty,
      rows: doc.rows,
      columns: doc.columns,
      visuals: doc.visuals,
      cells: doc.cells,
      rooms: doc.rooms ?? [],
      characters: doc.characters,
      clues: doc.clues,
      objects: doc.objects ?? [],
      walls: doc.walls ?? [],
      hints: doc.hints,
      solution,
    };
  }

  private toPersistence(definition: CaseDefinition) {
    return {
      ...definition,
      requiredLevel: definition.requiredLevel ?? requiredLevelForDifficulty(definition.difficulty),
      rooms: definition.rooms ?? [],
      objects: definition.objects ?? [],
      walls: definition.walls ?? [],
      solution: definition.solution
        ? {
            murderer_id: definition.solution.killerId,
            positions: definition.solution.positions,
          }
        : undefined,
    };
  }
}
