import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { HintQueryDto, ListCasesQueryDto, SolutionDto } from './dto/case.dto';
import { GatewaySecretGuard } from 'src/common/gateway-secret.guard';

@ApiTags('cases')
@UseGuards(GatewaySecretGuard)
@Controller('cases')
export class CasesController {
    constructor(private readonly service: CasesService) { }

    @Get()
    findAll(@Query() query: ListCasesQueryDto) {
        return this.service.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post(':id/validate')
    @HttpCode(200) // validar no crea nada: 200 y no el 201 por defecto de POST
    validate(@Param('id') id: string, @Body() dto: SolutionDto) {
        return this.service.validate(id, dto);
    }
    
    @Get(':id/hints')
    getHint(@Param('id') id: string, @Query() query: HintQueryDto) {
        return this.service.getHint(id, query.level);
    }
}