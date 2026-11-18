import { Body, Controller, Delete, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../common/admin.guard';
import { CasesUseCases } from './application/cases.usecases';
import { CreateCaseDto } from './dto/case.dto';
import { GatewaySecretGuard } from 'src/common/gateway-secret.guard';
import { toCaseDefinition, toDetail } from './http/cases.mapper';

@ApiTags('admin')
@ApiHeader({ name: 'x-roles', description: 'Lo inyecta el gateway. Para probar en Swagger: ADMIN', required: false })
@UseGuards(GatewaySecretGuard, AdminGuard)
@Controller('admin/cases')
export class AdminCasesController {
  constructor(private readonly cases: CasesUseCases) {}

  @Post()
  async create(@Body() dto: CreateCaseDto) {
    return toDetail(await this.cases.create(toCaseDefinition(dto)));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateCaseDto) {
    return toDetail(await this.cases.update(id, toCaseDefinition(dto)));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cases.remove(id);
  }
}
