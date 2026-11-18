import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CASE_REPOSITORY } from './application/ports/case.repository';
import { CasesUseCases } from './application/cases.usecases';
import { AdminCasesController } from './admin-cases.controller';
import { CasesController } from './cases.controller';
import { MongooseCasesAdapter } from './infrastructure/mongoose-cases.adapter';
import { CaseEntity, CaseSchema } from './schemas/case.schema';
import { SeedService } from './infrastructure/seed/seed.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: CaseEntity.name, schema: CaseSchema }])],
  controllers: [CasesController, AdminCasesController],
  providers: [
    CasesUseCases,
    { provide: CASE_REPOSITORY, useClass: MongooseCasesAdapter },
    SeedService,
  ],
})
export class CasesModule {}