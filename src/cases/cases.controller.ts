import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CasesUseCases } from './application/cases.usecases';
import { HintQueryDto, ListCasesQueryDto, SolutionDto } from './dto/case.dto';
import { GatewaySecretGuard } from 'src/common/gateway-secret.guard';
import {
  toCaseFilter,
  toDetail,
  toSolutionSubmission,
  toSummary,
} from './http/cases.mapper';

@ApiTags('cases')
@UseGuards(GatewaySecretGuard)
@Controller('cases')
export class CasesController {
    constructor(private readonly cases: CasesUseCases) {}

    @Get()
    async findAll(@Query() query: ListCasesQueryDto) {
        return (await this.cases.findAll(toCaseFilter(query))).map(toSummary);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return toDetail(await this.cases.findOne(id));
    }

    @Post(':id/validate')
    @HttpCode(200) // validar no crea nada: 200 y no el 201 por defecto de POST
    validate(@Param('id') id: string, @Body() dto: SolutionDto) {
        return this.cases.validate(id, toSolutionSubmission(dto));
    }
    
    @Get(':id/hints')
    getHint(@Param('id') id: string, @Query() query: HintQueryDto) {
        return this.cases.getHint(id, query.level);
    }
}