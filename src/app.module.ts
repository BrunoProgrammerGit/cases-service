// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CasesModule } from './cases/cases.module';
import { EurekaService } from './eureka/eureka.service';
import { HealthController } from './health.controller';
import { KafkaPingService } from './messaging/kafka-ping.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    CasesModule,
  ],
  controllers: [HealthController],
  providers: [EurekaService, KafkaPingService],
})
export class AppModule {}
