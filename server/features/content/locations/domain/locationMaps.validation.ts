import {
  CELL_UNITS_BY_KIND,
  LOCATION_MAP_GRID_MAX_HEIGHT,
  LOCATION_MAP_GRID_MAX_WIDTH,
  LOCATION_MAP_KINDS,
  type LocationMapKindId,
} from '../../../../../shared/domain/locations';

export type MapValidationError = {
  path: string;
  code: string;
  message: string;
};

function isPositiveInteger(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n > 0;
}

export function validateGridDimensions(width: unknown, height: unknown): MapValidationError[] {
  const errors: MapValidationError[] = [];
  if (!isPositiveInteger(width)) {
    errors.push({
      path: 'grid.width',
      code: 'INVALID_GRID',
      message: 'grid.width must be a positive integer',
    });
  } else if (width > LOCATION_MAP_GRID_MAX_WIDTH) {
    errors.push({
      path: 'grid.width',
      code: 'OUT_OF_RANGE',
      message: `grid.width must be at most ${LOCATION_MAP_GRID_MAX_WIDTH}`,
    });
  }
  if (!isPositiveInteger(height)) {
    errors.push({
      path: 'grid.height',
      code: 'INVALID_GRID',
      message: 'grid.height must be a positive integer',
    });
  } else if (height > LOCATION_MAP_GRID_MAX_HEIGHT) {
    errors.push({
      path: 'grid.height',
      code: 'OUT_OF_RANGE',
      message: `grid.height must be at most ${LOCATION_MAP_GRID_MAX_HEIGHT}`,
    });
  }
  return errors;
}

export function validateMapKind(kind: unknown): MapValidationError[] {
  if (typeof kind !== 'string' || !LOCATION_MAP_KINDS.includes(kind as LocationMapKindId)) {
    return [
      {
        path: 'kind',
        code: 'INVALID_KIND',
        message: `kind must be one of: ${LOCATION_MAP_KINDS.join(', ')}`,
      },
    ];
  }
  return [];
}

export function validateCellUnitForKind(kind: string, cellUnit: unknown): MapValidationError[] {
  const allowed = CELL_UNITS_BY_KIND[kind as LocationMapKindId];
  if (!allowed) {
    return [{ path: 'grid.cellUnit', code: 'INVALID_KIND', message: 'Unknown map kind' }];
  }
  if (typeof cellUnit !== 'string' || !(allowed as readonly string[]).includes(cellUnit)) {
    return [
      {
        path: 'grid.cellUnit',
        code: 'INVALID_CELL_UNIT',
        message: `cellUnit for "${kind}" must be one of: ${allowed.join(', ')}`,
      },
    ];
  }
  return [];
}

export type MapCellInput = { cellId: string; x: number; y: number; terrain?: string; label?: string };

export function validateLocationMapCells(
  cells: unknown,
  width: number,
  height: number,
): MapValidationError[] {
  const errors: MapValidationError[] = [];
  if (cells === undefined || cells === null) return errors;
  if (!Array.isArray(cells)) {
    return [{ path: 'cells', code: 'INVALID', message: 'cells must be an array' }];
  }

  const seenCellIds = new Set<string>();
  const seenXY = new Set<string>();

  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const prefix = `cells[${i}]`;
    if (!c || typeof c !== 'object') {
      errors.push({ path: prefix, code: 'INVALID_CELL', message: 'Each cell must be an object' });
      continue;
    }
    const row = c as Record<string, unknown>;
    if (typeof row.cellId !== 'string' || row.cellId.trim() === '') {
      errors.push({ path: `${prefix}.cellId`, code: 'REQUIRED', message: 'cellId is required' });
    } else if (seenCellIds.has(row.cellId)) {
      errors.push({
        path: `${prefix}.cellId`,
        code: 'DUPLICATE_CELL_ID',
        message: `Duplicate cellId "${row.cellId}"`,
      });
    } else {
      seenCellIds.add(row.cellId);
    }

    const x = row.x;
    const y = row.y;
    if (!Number.isInteger(x)) {
      errors.push({ path: `${prefix}.x`, code: 'INVALID', message: 'x must be an integer' });
    }
    if (!Number.isInteger(y)) {
      errors.push({ path: `${prefix}.y`, code: 'INVALID', message: 'y must be an integer' });
    }
    if (Number.isInteger(x) && Number.isInteger(y)) {
      const xi = x as number;
      const yi = y as number;
      const xyKey = `${xi},${yi}`;
      if (seenXY.has(xyKey)) {
        errors.push({
          path: `${prefix}.x`,
          code: 'DUPLICATE_COORDINATES',
          message: `Duplicate grid coordinates (${xi}, ${yi})`,
        });
      } else {
        seenXY.add(xyKey);
      }
      if (xi < 0 || xi > width - 1) {
        errors.push({
          path: `${prefix}.x`,
          code: 'OUT_OF_BOUNDS',
          message: `x must be between 0 and ${width - 1}`,
        });
      }
      if (yi < 0 || yi > height - 1) {
        errors.push({
          path: `${prefix}.y`,
          code: 'OUT_OF_BOUNDS',
          message: `y must be between 0 and ${height - 1}`,
        });
      }
    }
  }

  return errors;
}

/** Full map payload validation (create or merged update). */
export function validateLocationMapInput(payload: {
  name: string;
  kind: string;
  grid: { width: number; height: number; cellUnit: unknown };
  cells?: unknown;
}): MapValidationError[] {
  const errors: MapValidationError[] = [];
  if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    errors.push({ path: 'name', code: 'REQUIRED', message: 'name is required' });
  }

  errors.push(...validateMapKind(payload.kind));
  if (!payload.grid || typeof payload.grid !== 'object') {
    errors.push({ path: 'grid', code: 'REQUIRED', message: 'grid is required' });
    return errors;
  }

  const g = payload.grid as Record<string, unknown>;
  errors.push(...validateGridDimensions(g.width, g.height));

  if (errors.some((e) => e.path.startsWith('grid.width') || e.path.startsWith('grid.height'))) {
    return errors;
  }

  errors.push(...validateCellUnitForKind(payload.kind, g.cellUnit));

  const w = g.width as number;
  const h = g.height as number;
  errors.push(...validateLocationMapCells(payload.cells, w, h));

  return errors;
}

/** Collect authored cell ids from a map's cells array (sparse). */
export function cellIdsOnMap(cells: unknown): Set<string> {
  const s = new Set<string>();
  if (!Array.isArray(cells)) return s;
  for (const c of cells) {
    if (c && typeof c === 'object' && typeof (c as Record<string, unknown>).cellId === 'string') {
      s.add((c as Record<string, unknown>).cellId as string);
    }
  }
  return s;
}

export function cellIdExistsOnMap(cells: unknown, cellId: string): boolean {
  return cellIdsOnMap(cells).has(cellId);
}
