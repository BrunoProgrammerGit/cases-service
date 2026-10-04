import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum Category { HOGAR = 'HOGAR', OFICINAS = 'OFICINAS', TRABAJO = 'TRABAJO', TURISTICO = 'TURISTICO' }
export enum Difficulty { EASY = 'EASY', MEDIUM = 'MEDIUM', HARD = 'HARD' }

@Schema({ _id: false })
export class Cell {
    @Prop({ required: true })
    x!: number;
    @Prop({ required: true })
    y!: number;
    @Prop({ default: true })
    occupable!: boolean;
    @Prop({ enum: ['ROOM', 'FIXED_OBJECT', 'EMPTY'], default: 'EMPTY' })
    type!: string;
    @Prop() name?: string;
}
export const CellSchema = SchemaFactory.createForClass(Cell);

@Schema({ _id: false })
export class Character {
    @Prop({ required: true })
    id!: string;
    @Prop({ required: true })
    name!: string;
    @Prop({ required: true, enum: ['SUSPECT', 'VICTIM'] })
    role!: string;
    @Prop() description?: string;
}
export const CharacterSchema = SchemaFactory.createForClass(Character);

@Schema({ _id: false })
export class Clue {
    @Prop({ required: true })
    id!: string;
    @Prop({ required: true })
    text!: string;
}
export const ClueSchema = SchemaFactory.createForClass(Clue);

@Schema({ _id: false })
export class Hint {
    @Prop({ required: true })
    level!: number;
    @Prop({ required: true })
    text!: string;
}
export const HintSchema = SchemaFactory.createForClass(Hint);

@Schema({ _id: false })
export class Position {
    @Prop({ required: true })
    characterId!: string;
    @Prop({ required: true })
    x!: number;
    @Prop({ required: true })
    y!: number;
}
export const PositionSchema = SchemaFactory.createForClass(Position);

@Schema({ _id: false })
export class Solution {
    @Prop({ required: true })
    killerId!: string;
    @Prop({ type: [PositionSchema], default: [] })
    positions!: Position[];
}
export const SolutionSchema = SchemaFactory.createForClass(Solution);

@Schema({ collection: 'cases', timestamps: true })
export class CaseEntity {
    @Prop({ required: true })
    title!: string;
    @Prop({ required: true, enum: Object.values(Category) })
    category!: Category;
    @Prop({ required: true, enum: Object.values(Difficulty) })
    difficulty!: Difficulty;
    @Prop({ required: true })
    rows!: number;
    @Prop({ required: true })
    columns!: number;
    @Prop({ type: [CellSchema], default: [] })
    cells!: Cell[];
    @Prop({ type: [CharacterSchema], default: [] })
    characters!: Character[];
    @Prop({ type: [ClueSchema], default: [] })
    clues!: Clue[];
    @Prop({ type: [HintSchema], default: [] })
    hints!: Hint[];
    @Prop({ type: SolutionSchema, select: false }) solution?: Solution; 
}

export type CaseDocument = HydratedDocument<CaseEntity>;
export const CaseSchema = SchemaFactory.createForClass(CaseEntity);