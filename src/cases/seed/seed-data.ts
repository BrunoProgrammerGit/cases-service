//Usa funciones auxiliares para no repetir JSON. Cuatro casos, uno por categoría. Son datos de demostración y las posiciones no están ligadas a reglas de juego reales, así que ajústalos a tus reglas

import { CellDto, CharacterDto, CreateCaseDto } from '../dto/case.dto';
import { Category, Difficulty } from '../schemas/case.schema';

const room = (x: number, y: number, name: string): CellDto => ({ x, y, occupable: true, type: 'ROOM', name });
const obj = (x: number, y: number, name: string): CellDto => ({ x, y, occupable: false, type: 'FIXED_OBJECT', name });
const empty = (x: number, y: number): CellDto => ({ x, y, occupable: false, type: 'EMPTY' });
const victim = (name: string, description: string): CharacterDto => ({ id: 'V1', name, role: 'VICTIM', description });
const suspect = (n: number, name: string, description: string): CharacterDto => ({ id: `S${n}`, name, role: 'SUSPECT', description });

type Pos = [string, number, number];

function buildCase(
  title: string, category: Category, difficulty: Difficulty,
  cells: CellDto[], characters: CharacterDto[],
  clues: string[], hints: string[], killerId: string, positions: Pos[],
): CreateCaseDto {
  return {
    title, category, difficulty, rows: 3, columns: 3, cells, characters,
    clues: clues.map((text, i) => ({ id: `C${i + 1}`, text })),
    hints: hints.map((text, i) => ({ level: i + 1, text })),
    solution: { killerId, positions: positions.map(([characterId, x, y]) => ({ characterId, x, y })) },
  };
}

export const SEED_CASES: CreateCaseDto[] = [
  buildCase(
    'Muerte en la cocina', Category.HOGAR, Difficulty.EASY,
    [room(0, 0, 'Cocina'), room(1, 0, 'Sala'), obj(2, 0, 'Nevera'),
     room(0, 1, 'Comedor'), obj(1, 1, 'Mesa'), room(2, 1, 'Baño'),
     room(0, 2, 'Garaje'), room(1, 2, 'Patio'), empty(2, 2)],
    [victim('Don Ernesto', 'Dueño de la casa'), suspect(1, 'Marta', 'La cocinera'),
     suspect(2, 'Julián', 'El sobrino'), suspect(3, 'Lucía', 'La vecina')],
    ['La víctima fue hallada en la cocina.', 'Julián estaba en el comedor.'],
    ['Empieza ubicando a la víctima.', 'Julián está en una habitación contigua a la cocina.'],
    'S1', [['V1', 0, 0], ['S1', 1, 0], ['S2', 0, 1], ['S3', 2, 1]],
  ),
  buildCase(
    'Fraude en la oficina', Category.OFICINAS, Difficulty.MEDIUM,
    [room(0, 0, 'Recepción'), room(1, 0, 'Sala de juntas'), obj(2, 0, 'Impresora'),
     room(0, 1, 'Archivo'), obj(1, 1, 'Escritorio'), room(2, 1, 'Cafetería'),
     room(0, 2, 'Gerencia'), room(1, 2, 'Bodega'), empty(2, 2)],
    [victim('Sr. Pardo', 'Gerente financiero'), suspect(1, 'Andrea', 'Contadora'),
     suspect(2, 'Camilo', 'Auditor externo'), suspect(3, 'Diana', 'Asistente')],
    ['El Sr. Pardo fue hallado en Gerencia.', 'Andrea estaba en la recepción.'],
    ['La víctima nunca salió de su despacho.', 'El auditor estaba en el archivo.'],
    'S2', [['V1', 0, 2], ['S1', 0, 0], ['S2', 0, 1], ['S3', 1, 2]],
  ),
  buildCase(
    'Accidente en la obra', Category.TRABAJO, Difficulty.HARD,
    [room(0, 0, 'Oficina de obra'), obj(1, 0, 'Grúa'), room(2, 0, 'Almacén'),
     room(0, 1, 'Comedor'), room(1, 1, 'Piso 1'), obj(2, 1, 'Mezcladora'),
     empty(0, 2), room(1, 2, 'Piso 2'), room(2, 2, 'Azotea')],
    [victim('Ing. Salcedo', 'Director de obra'), suspect(1, 'Pedro', 'Maestro de obra'),
     suspect(2, 'Rosa', 'Inspectora de seguridad'), suspect(3, 'Iván', 'Operador de grúa')],
    ['La víctima estaba en la azotea.', 'Rosa almorzaba en el comedor.'],
    ['Ubica primero el lugar más alto de la obra.', 'El maestro de obra estaba justo debajo de la víctima.'],
    'S1', [['V1', 2, 2], ['S1', 1, 2], ['S2', 0, 1], ['S3', 0, 0]],
  ),
  buildCase(
    'Misterio en el museo', Category.TURISTICO, Difficulty.MEDIUM,
    [room(0, 0, 'Vestíbulo'), room(1, 0, 'Sala colonial'), room(2, 0, 'Jardín'),
     obj(0, 1, 'Fuente'), room(1, 1, 'Patio central'), room(2, 1, 'Tienda de recuerdos'),
     empty(0, 2), room(1, 2, 'Sótano'), obj(2, 2, 'Estatua')],
    [victim('Dr. Mendoza', 'Curador del museo'), suspect(1, 'Elena', 'Guía turística'),
     suspect(2, 'Tomás', 'Vigilante'), suspect(3, 'Sofía', 'Cajera de la tienda')],
    ['El curador apareció en el sótano.', 'Sofía no se movió de la tienda.'],
    ['El sótano es la pista más importante.', 'El vigilante hacía su ronda por el patio central.'],
    'S3', [['V1', 1, 2], ['S1', 2, 0], ['S2', 1, 1], ['S3', 2, 1]],
  ),
];