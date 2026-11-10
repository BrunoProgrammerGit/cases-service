import { CreateCaseDto } from './dto/case.dto';

const duplicates = (values: string[]): string[] =>
    [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];


export function validateCaseDefinition(dto: CreateCaseDto): string[] {
    const errors: string[] = [];

    const cells = new Map<string, { occupable: boolean; type: string; name?: string; roomId?: string }>();
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
    if (cells.size !== dto.rows * dto.columns) errors.push(`El tablero debe tener ${dto.rows * dto.columns} celdas (hay ${cells.size})`);
    for (let y = 0; y < dto.rows; y++) for (let x = 0; x < dto.columns; x++) {
        if (!cells.has(`${x},${y}`)) errors.push(`Falta la celda (${x},${y})`);
    }

    // Legacy ROOM cells use their visible name as a stable grouping fallback.
    const roomGroups = new Map<string, string[]>();
    for (const [key, cell] of cells) {
        if (cell.roomId && cell.type !== 'ROOM') errors.push(`La celda (${key}) define roomId pero no es ROOM`);
        const group = cell.roomId ? `id:${cell.roomId}` : (cell.type === 'ROOM' && cell.name ? `legacy:${cell.name}` : undefined);
        if (group) roomGroups.set(group, [...(roomGroups.get(group) ?? []), key]);
    }
    for (const [roomId, roomCells] of roomGroups) {
        const visited = new Set<string>([roomCells[0]]);
        const queue = [roomCells[0]];
        while (queue.length) {
            const [x, y] = queue.shift()!.split(',').map(Number);
            for (const key of [`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`]) {
                if (roomCells.includes(key) && !visited.has(key)) { visited.add(key); queue.push(key); }
            }
        }
        if (visited.size !== roomCells.length) errors.push(`La habitación '${roomId}' no forma una región conectada`);
    }

    const objectIds = (dto.objects ?? []).map((o) => o.id);
    duplicates(objectIds).forEach((id) => errors.push(`El id de objeto '${id}' está repetido`));
    for (const object of dto.objects ?? []) {
        if (!object.cells.length) errors.push(`El objeto '${object.id}' debe ocupar al menos una celda`);
        const objectCells = new Set<string>();
        for (const p of object.cells) {
            const key = `${p.x},${p.y}`;
            if (!cells.has(key)) errors.push(`El objeto '${object.id}' referencia la celda (${key}) inexistente`);
            if (objectCells.has(key)) errors.push(`El objeto '${object.id}' repite la celda (${key})`);
            objectCells.add(key);
        }
    }
    const wallKeys = new Set<string>();
    for (const wall of dto.walls ?? []) {
        const dx = wall.side === 'EAST' ? 1 : wall.side === 'WEST' ? -1 : 0;
        const dy = wall.side === 'SOUTH' ? 1 : wall.side === 'NORTH' ? -1 : 0;
        const nx = wall.x + dx, ny = wall.y + dy;
        if (!cells.has(`${wall.x},${wall.y}`) || !cells.has(`${nx},${ny}`)) {
            errors.push(`El muro (${wall.x},${wall.y},${wall.side}) debe separar dos celdas existentes`);
            continue;
        }
        const edge = [`${wall.x},${wall.y}`, `${nx},${ny}`].sort().join('|');
        if (wallKeys.has(edge)) errors.push(`El borde entre (${wall.x},${wall.y}) y (${nx},${ny}) está repetido`);
        wallKeys.add(edge);
    }

    const ids = dto.characters.map((c) => c.id);
    duplicates(ids).forEach((id) => errors.push(`El id de personaje '${id}' está repetido`));
    const victims = dto.characters.filter((c) => c.role === 'VICTIM');
    const suspects = dto.characters.filter((c) => c.role === 'SUSPECT');
    if (victims.length !== 1) errors.push(`Debe haber exactamente 1 víctima (hay ${victims.length})`);
    if (suspects.length < 1) errors.push('Debe haber al menos 1 sospechoso');

    duplicates(dto.clues.map((c) => c.id)).forEach((id) => errors.push(`El id de pista '${id}' está repetido`));
    for (const clue of dto.clues) {
        if (clue.scope === 'CHARACTER' && !ids.includes(clue.characterId ?? '')) errors.push(`La pista '${clue.id}' referencia un personaje inexistente`);
        if (clue.scope !== 'CHARACTER' && clue.characterId) errors.push(`La pista '${clue.id}' solo puede incluir characterId con scope CHARACTER`);
    }
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
