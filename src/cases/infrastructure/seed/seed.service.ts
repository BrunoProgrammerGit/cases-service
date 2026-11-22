import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CaseDocument, CaseEntity } from '../../schemas/case.schema';
import { CaseDefinition } from '../../domain/case.model';
import { validateCaseDefinition } from '../../domain/case-definition.policy';

type CatalogCase = CaseDefinition & { seedKey: string; isTutorial?: boolean };
const LEGACY_TEST_CASE_TITLES = [
  'Muerte en la cocina',
  'Fraude en la oficina',
  'Accidente en la obra',
  'Misterio en el museo',
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectModel(CaseEntity.name) private readonly model: Model<CaseDocument>) {}

  async onModuleInit(): Promise<void> {
    const catalogPath = join(__dirname, '../../seed/catalog.json');
    const cases = JSON.parse(readFileSync(catalogPath, 'utf8')) as CatalogCase[];
    if (cases.length === 0) throw new Error('El catálogo de casos está vacío');

    for (const c of cases) {
      if (!c.seedKey?.trim()) throw new Error(`Caso sin seedKey: '${c.title}'`);
      const errors = validateCaseDefinition(c, true);
      if (errors.length > 0) {
        throw new Error(`Caso semilla inválido '${c.title}': ${errors.join('; ')}`);
      }
    }

    // Migrate the existing tutorial document in place so its Mongo id stays stable.
    const tutorial = cases.find((c) => c.isTutorial);
    if (!tutorial) throw new Error('El catálogo debe marcar un caso tutorial');
    const existingTutorial = await this.model.findOne({
      $or: [
        { seedKey: tutorial.seedKey },
        { isTutorial: true },
        { title: tutorial.title },
      ],
    }).select('_id').lean();

    let synchronized = 0;
    for (const c of cases) {
      const { seedKey, isTutorial = false, ...definition } = c;
      const update = { ...definition, seedKey, isTutorial };
      if (c.isTutorial && existingTutorial?._id) {
        await this.model.updateOne(
          { _id: existingTutorial._id },
          { $set: update },
          { runValidators: true },
        );
      } else {
        await this.model.updateOne(
          { seedKey },
          { $set: update },
          { upsert: true, runValidators: true, setDefaultsOnInsert: true },
        );
      }
      synchronized += 1;
    }

    const removed = await this.model.deleteMany({
      title: { $in: LEGACY_TEST_CASE_TITLES },
      isTutorial: { $ne: true },
      seedKey: { $exists: false },
    });
    this.logger.log(
      `Catálogo reconciliado: ${synchronized} casos; ${removed.deletedCount} casos de prueba antiguos retirados`,
    );
  }
}
