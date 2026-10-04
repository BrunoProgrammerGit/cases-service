import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CaseDocument, CaseEntity } from './schemas/case.schema';
import {
    CaseDto, CaseSummaryDto, CreateCaseDto, HintDto, ListCasesQueryDto, SolutionDto, ValidationResultDto,
} from './dto/case.dto';
import { toDetail, toSummary } from './cases.mapper';

@Injectable()
export class CasesService {
    constructor(@InjectModel(CaseEntity.name) private readonly model: Model<CaseDocument>) { }

    private assertId(id: string) {
        if (!isValidObjectId(id)) throw new BadRequestException(`Id inválido: ${id}`);
    }

    async findAll(q: ListCasesQueryDto): Promise<CaseSummaryDto[]> {
        const filter: Record<string, string> = {};
        if (q.category) filter.category = q.category;
        if (q.difficulty) filter.difficulty = q.difficulty;
        const docs = await this.model.find(filter).lean();
        return docs.map(toSummary);
    }

    async findOne(id: string): Promise<CaseDto> {
        this.assertId(id);
        const doc = await this.model.findById(id).lean();
        if (!doc) throw new NotFoundException(`Caso ${id} no existe`);
        return toDetail(doc);
    }

    async getHint(id: string, level: number): Promise<HintDto> {
        this.assertId(id);
        const doc = await this.model.findById(id).select('hints').lean();
        if (!doc) throw new NotFoundException(`Caso ${id} no existe`);

        const hint = doc.hints.find((h) => h.level === level);
        if (!hint) {
            const max = Math.max(0, ...doc.hints.map((h) => h.level));
            throw new NotFoundException(`No hay pista de nivel ${level}. Niveles disponibles: 1 a ${max}`);
        }
        return { level: hint.level, text: hint.text };
    }

    async create(dto: CreateCaseDto): Promise<CaseDto> {
        const created = await this.model.create(dto);
        return toDetail(created.toObject());
    }

    async update(id: string, dto: CreateCaseDto): Promise<CaseDto> {
        this.assertId(id);
        const doc = await this.model
            .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
            .lean();
        if (!doc) throw new NotFoundException(`Caso ${id} no existe`);
        return toDetail(doc);
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        this.assertId(id);
        const doc = await this.model.findByIdAndDelete(id).lean();
        if (!doc) throw new NotFoundException(`Caso ${id} no existe`);
        return { deleted: true };
    }

    async validate(id: string, dto: SolutionDto): Promise<ValidationResultDto> {
        this.assertId(id);
        const doc = await this.model.findById(id).select('+solution').lean();
        if (!doc) throw new NotFoundException(`Caso ${id} no existe`);
        if (!doc.solution) throw new BadRequestException('El caso no tiene una solución configurada');

        const expected = doc.solution.positions;
        const submitted = new Map(dto.positions.map((p) => [p.characterId, p]));
        const correctCount = expected.filter((e) => {
            const s = submitted.get(e.characterId);
            return s && s.x === e.x && s.y === e.y;
        }).length;

        const total = expected.length;
        const valid = correctCount === total && submitted.size === total;
        return { valid, killerFound: valid, correctCount, total };
    }
}