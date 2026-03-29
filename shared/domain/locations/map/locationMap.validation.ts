/**
 * Pure location map payload validation (grid, cells, layout, cell authoring).
 * Shared by server API and optionally client-side checks.
 */
import {
  CELL_UNITS_BY_KIND,
  LOCATION_MAP_GRID_MAX_HEIGHT,
  LOCATION_MAP_GRID_MAX_WIDTH,
  LOCATION_MAP_KIND_IDS,
} from './locationMap.constants';
import type { LocationMapKindId } from './locationMap.types';
import { validateCellEntriesStructure } from './locationMapCellAuthoring.validation';
import { GRID_GEOMETRY_IDS } from '../../grid/gridGeometry';

export type LocationMapValidationError = {
  path: string;
  code: string;
  message: string;
};

function isPositiveInteger(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n > 0;
}

export function validateGridDimensions(
  width: unknown,
  height: unknown,
): LocationMapValidationError[] {
  const errors: LocationMapValidationError[] = [];
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

export function validateMapKind(kind: unknown): LocationMapValidationError[] {
  if (typeof kind !== 'string' || !LOCATION_MAP_KIND_IDS.includes(kind as LocationMapKindId)) {
    return [
      {
        path: 'kind',
        code: 'INVALID_KIND',
        message: `kind must be one of: ${LOCATION_MAP_KIND_IDS.join(', ')}`,
      },
    ];
  }
  return [];
}

export function validateCellUnitForKind(
  kind: string,
  cellUnit: unknown,
): LocationMapValidationError[] {
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

const GEOMETRY_SET = new Set<string>(GRID_GEOMETRY_IDS);

export function validateGridGeometry(geometry: unknown): LocationMapValidationError[] {
  if (geometry === undefined || geometry === null) return [];
  if (typeof geometry !== 'string' || !GEOMETRY_SET.has(geometry)) {
    return [
      {
        path: 'grid.geometry',
        code: 'INVALID_GEOMETRY',
        message: `grid.geometry must be one of: ${GRID_GEOMETRY_IDS.join(', ')}`,
      },
    ];
  }
  return [];
}

export type MapCellInput = {
  cellId: string;
  x: number;
  y: number;
  terrain?: string;
  label?: string;
};

export function validateLocationMapCells(
  cells: unknown,
  width: number,
  height: number,
): LocationMapValidationError[] {
  const errors: LocationMapValidationError[] = [];
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

export function validateLocationMapLayout(layout: unknown): LocationMapValidationError[] {
  const errors: LocationMapValidationError[] = [];
  if (layout === undefined || layout === null) return errors;
  if (typeof layout !== 'object') {
    return [{ path: 'layout', code: 'INVALID', message: 'layout must be an object' }];
  }
  const row = layout as Record<string, unknown>;
  if (row.excludedCellIds !== undefined) {
    if (!Array.isArray(row.excludedCellIds)) {
      errors.push({
        path: 'layout.excludedCellIds',
        code: 'INVALID',
        message: 'excludedCellIds must be an array',
      });
    } else {
      for (let i = 0; i < row.excludedCellIds.length; i++) {
        const id = row.excludedCellIds[i];
        if (typeof id !== 'string' || id.trim() === '') {
          errors.push({
            path: `layout.excludedCellIds[${i}]`,
            code: 'INVALID',
            message: 'Each excluded cell id must be a non-empty string',
          });
        }
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
  layout?: unknown;
  cellEntries?: unknown;
}): LocationMapValidationError[] {
  const errors: LocationMapValidationError[] = [];
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
  errors.push(...validateGridGeometry(g.geometry));

  const w = g.width as number;
  const h = g.height as number;
  errors.push(...validateLocationMapCells(payload.cells, w, h));

  errors.push(...validateLocationMapLayout(payload.layout));

  errors.push(...validateCellEntriesStructure(payload.cellEntries, w, h));

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
