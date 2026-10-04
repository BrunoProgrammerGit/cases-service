// app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CasesModule } from './cases/cases.module';
import { EurekaService } from './eureka/eureka.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({ uri: process.env.MONGO_URI }),
    }),
    CasesModule,
  ],
  controllers: [HealthController],
  providers: [EurekaService],
})
export class AppModule {}