import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { MetricsAuthGuard } from './metrics-auth.guard';
import { HttpMetricsService } from './http-metrics.service';

@ApiExcludeController()
@UseGuards(MetricsAuthGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: HttpMetricsService) {}

  @Get()
  async getMetrics(@Res() response: Response): Promise<void> {
    response.setHeader('Content-Type', this.metrics.contentType);
    response.send(await this.metrics.metrics());
  }
}
