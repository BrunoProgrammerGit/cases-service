import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CaseDocument, CaseEntity } from '../schemas/case.schema';
import { SEED_CASES } from './seed-data';
import { validateCaseDefinition } from '../case-definition.validator';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectModel(CaseEntity.name) private readonly model: Model<CaseDocument>) { }

  async onModuleInit() {
    for (const c of SEED_CASES) {
      const errors = validateCaseDefinition(c);
      if (errors.length > 0) {
        throw new Error(`Caso semilla inválido '${c.title}': ${errors.join('; ')}`);
      }
    }
    if ((await this.model.countDocuments()) > 0) return; // solo siembra si la colección está vacía
    await this.model.insertMany(SEED_CASES);
    this.logger.log(`Sembrados ${SEED_CASES.length} casos de ejemplo`);
  }
}