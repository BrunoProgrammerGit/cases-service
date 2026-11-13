import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DEFAULT_FLOOR_ID } from '../case.constants';
import { BACKGROUND_IDS, CHARACTER_VISUAL_IDS, FLOOR_IDS, OBSTACLE_IDS } from '../visual-catalog';

export enum Category { HOGAR = 'HOGAR', OFICINAS = 'OFICINAS', TRABAJO = 'TRABAJO', TURISTICO = 'TURISTICO' }
export enum Difficulty { EASY = 'EASY', MEDIUM = 'MEDIUM', HARD = 'HARD' }

@Schema({ _id: false })
export class CellVisual {
    @Prop({ type: String, enum: [...FLOOR_IDS], default: undefined })
    floorId?: string | null;
    @Prop({ type: String, enum: [...OBSTACLE_IDS], default: null })
    obstacleId?: string | null;
}
export const CellVisualSchema = SchemaFactory.createForClass(CellVisual);

@Schema({ _id: false })
export class CaseVisuals {
    @Prop({ type: String, enum: [...BACKGROUND_IDS], default: null })
    backgroundId?: string | null;
    @Prop({ type: String, enum: [...FLOOR_IDS], default: DEFAULT_FLOOR_ID })
    floorId?: string | null;
}
export const CaseVisualsSchema = SchemaFactory.createForClass(CaseVisuals);

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
    @Prop() roomId?: string;
    @Prop({ type: CellVisualSchema, default: undefined })
    visual?: CellVisual;
}
export const CellSchema = SchemaFactory.createForClass(Cell);

@Schema({ _id: false })
export class Character {
    @Prop({ required: true, trim: true })
    id!: string;
    @Prop({ required: true, trim: true })
    name!: string;
    @Prop({ required: true, enum: ['SUSPECT', 'VICTIM'] })
    role!: string;
    @Prop() description?: string;
    @Prop({ type: String, enum: [...CHARACTER_VISUAL_IDS], default: null })
    visualId?: string | null;
}
export const CharacterSchema = SchemaFactory.createForClass(Character);

@Schema({ _id: false })
export class Clue {
    @Prop({ required: true })
    id!: string;
    @Prop({ required: true })
    text!: string;
    @Prop({ enum: ['GENERAL', 'CHARACTER'], default: undefined })
    scope?: string;
    @Prop()
    characterId?: string;
}
export const ClueSchema = SchemaFactory.createForClass(Clue);

@Schema({ _id: false })
export class CaseObject {
    @Prop({ required: true }) id!: string;
    @Prop({ required: true }) type!: string;
    @Prop({ type: [{ x: Number, y: Number }], required: true }) cells!: { x: number; y: number }[];
    @Prop() name?: string;
}
export const CaseObjectSchema = SchemaFactory.createForClass(CaseObject);

@Schema({ _id: false })
export class Wall {
    @Prop({ required: true }) x!: number;
    @Prop({ required: true }) y!: number;
    @Prop({ required: true, enum: ['NORTH', 'EAST', 'SOUTH', 'WEST'] }) side!: string;
}
export const WallSchema = SchemaFactory.createForClass(Wall);

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
    @Prop({ type: CaseVisualsSchema, default: () => ({}) })
    visuals?: CaseVisuals;
    @Prop({ type: [CellSchema], default: [] })
    cells!: Cell[];
    @Prop({ type: [CharacterSchema], default: [] })
    characters!: Character[];
    @Prop({ type: [ClueSchema], default: [] })
    clues!: Clue[];
    @Prop({ type: [CaseObjectSchema], default: undefined }) objects?: CaseObject[];
    @Prop({ type: [WallSchema], default: undefined }) walls?: Wall[];
    @Prop({ type: [HintSchema], default: [] })
    hints!: Hint[];
    @Prop({ type: SolutionSchema, select: false }) solution?: Solution; 
}

export type CaseDocument = HydratedDocument<CaseEntity>;
export const CaseSchema = SchemaFactory.createForClass(CaseEntity);