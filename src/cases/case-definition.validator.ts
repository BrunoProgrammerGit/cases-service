import { CreateCaseDto } from './dto/case.dto';

const duplicates = (values: string[]): string[] =>
    [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];


export function validateCaseDefinition(dto: CreateCaseDto): string[] {
    const errors: string[] = [];

    const cells = new Map<string, { occupable: boolean; type: string; name?: string }>();
    for (const c of dto.cells) {
        const key = `${c.x},${c.y}`;
        if (c.x >= dto.columns || c.y >= dto.rows) {
            errors.push(`La celda (${key}) está fuera del tablero de ${dto.columns} columnas x ${dto.rows} filas`);
        }
        if (cells.has(key)) errors.push(`La celda (${key}) está repetida`);
        if (c.type !== 'ROOM' && c.occupable) {
            errors.push(`La celda (${key}) es ${c.type} y no puede ser ocupable`);
        }
        cells.set(key, c);
    }

    const ids = dto.characters.map((c) => c.id);
    duplicates(ids).forEach((id) => errors.push(`El id de personaje '${id}' está repetido`));
    const victims = dto.characters.filter((c) => c.role === 'VICTIM');
    const suspects = dto.characters.filter((c) => c.role === 'SUSPECT');
    if (victims.length !== 1) errors.push(`Debe haber exactamente 1 víctima (hay ${victims.length})`);
    if (suspects.length < 1) errors.push('Debe haber al menos 1 sospechoso');

    duplicates(dto.clues.map((c) => c.id)).forEach((id) => errors.push(`El id de pista '${id}' está repetido`));
    const levels = dto.hints.map((h) => h.level).sort((a, b) => a - b);
    if (levels.some((l, i) => l !== i + 1)) {
        errors.push(`Los niveles de ayuda deben ser consecutivos desde 1 (recibidos: ${levels.join(', ')})`);
    }

    const solution = dto.solution;
    if (!solution) {
        errors.push('Falta la solución');
        return errors;
    }

    const killer = dto.characters.find((c) => c.id === solution.killerId);
    if (!killer) {
        errors.push(`El asesino '${solution.killerId}' no corresponde a ningún personaje`);
    } else if (killer.role !== 'SUSPECT') {
        errors.push(`El asesino '${killer.id}' debe ser un sospechoso, no la víctima`);
    }

    const placed = solution.positions.map((p) => p.characterId);
    duplicates(placed).forEach((id) => errors.push(`El personaje '${id}' aparece más de una vez en la solución`));
    placed
        .filter((id) => !ids.includes(id))
        .forEach((id) => errors.push(`La solución incluye '${id}', que no es un personaje del caso`));
    [...new Set(ids)]
        .filter((id) => !placed.includes(id))
        .forEach((id) => errors.push(`Falta la posición de '${id}' en la solución`));

    for (const p of solution.positions) {
        const cell = cells.get(`${p.x},${p.y}`);
        if (!cell) {
            errors.push(`'${p.characterId}' está en (${p.x},${p.y}), que no existe en el tablero`);
        } else if (!cell.occupable) {
            errors.push(`'${p.characterId}' está en (${p.x},${p.y}), una casilla no ocupable (${cell.name ?? cell.type})`);
        }
    }

    const used = new Set<string>();
    for (const p of solution.positions) {
        const key = `${p.x},${p.y}`;
        if (used.has(key)) errors.push(`Dos personajes comparten la casilla (${key})`);
        used.add(key);
    }

    return errors;
}