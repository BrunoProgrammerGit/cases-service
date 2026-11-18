import { Module } from '@nestjs/common';
import { HttpMetricsService } from './http-metrics.service';
import { MetricsAuthGuard } from './metrics-auth.guard';
import { MetricsController } from './metrics.controller';

@Module({
  controllers: [MetricsController],
  providers: [HttpMetricsService, MetricsAuthGuard],
  exports: [HttpMetricsService],
})
export class ObservabilityModule {}
