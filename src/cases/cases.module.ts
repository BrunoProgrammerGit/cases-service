import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminCasesController } from './admin-cases.controller';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { CaseEntity, CaseSchema } from './schemas/case.schema';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: CaseEntity.name, schema: CaseSchema }])],
  controllers: [CasesController, AdminCasesController],
  providers: [CasesService, SeedService],
})
export class CasesModule {}