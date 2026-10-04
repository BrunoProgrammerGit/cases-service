import { Body, Controller, Delete, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../common/admin.guard';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/case.dto';

@ApiTags('admin')
@ApiHeader({ name: 'x-roles', description: 'Lo inyecta el gateway. Para probar en Swagger: ADMIN', required: false })
@UseGuards(AdminGuard)
@Controller('admin/cases')
export class AdminCasesController {
  constructor(private readonly service: CasesService) {}

  @Post()
  create(@Body() dto: CreateCaseDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateCaseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
