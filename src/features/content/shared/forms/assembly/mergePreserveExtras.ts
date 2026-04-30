/**
 * Repeatable-group save-time assembly: merge a form-side row list back into the
 * domain shape, preserving fields the form does not author yet.
 *
 * The MVP form for `traits` / `definitions.options` / class `features[]` exposes
 * only `name` (and optionally `description`), but the domain rows carry many other
 * fields (`trigger`, `effects`, `uses`, `damage`, `attackBonus`, …). Stripping
 * those on save would be a regression. To preserve them per row, we tag each
 * row with a transient `__rowId` at load time and use it as the merge key here.
 *
 * Behavior:
 * - Form rows are matched by `__rowId` to a source row from `sourceRows`.
 * - For matched rows, the form's owned keys overwrite the source row; other
 *   fields are preserved as-is.
 * - Form rows with no source match (newly added) become a fresh object holding
 *   only the form-owned keys.
 * - The transient `__rowId` is stripped from the returned objects.
 *
 * The output is in form order — reorder/insert/delete operations are honored.
 */

export type RowWithId = { __rowId?: string };

/**
 * Pick the form-owned keys off `formRow`. Skips undefined values so callers
 * decide whether undefined should clobber the source value.
 */
function pickOwned<T extends Record<string, unknown>>(
  formRow: Record<string, unknown>,
  ownedKeys: readonly (keyof T & string)[],
): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const key of ownedKeys) {
    if (key in formRow) {
      const value = formRow[key];
      if (value !== undefined) {
        out[key] = value;
      }
    }
  }
  return out as Partial<T>;
}

/**
 * Strip the transient row identity tag.
 */
function stripRowId<T extends Record<string, unknown>>(row: T & RowWithId): T {
  if (!('__rowId' in row)) return row as T;
  const { __rowId: _omit, ...rest } = row;
  void _omit;
  return rest as unknown as T;
}

/**
 * Merge form rows back into domain rows, preserving extras-by-id.
 *
 * @param formRows - UI rows; each carries an optional `__rowId` and the form-owned keys.
 * @param sourceRows - The domain rows loaded for this entry (with `__rowId` tagged at load).
 * @param ownedKeys - Keys the form authoritatively owns (e.g. `['name','description']`).
 * @returns Domain rows in form order with extras preserved by id.
 */
export function mergePreserveExtras<T extends Record<string, unknown>>(
  formRows: ReadonlyArray<RowWithId & Partial<T>>,
  sourceRows: ReadonlyArray<T & RowWithId> | undefined,
  ownedKeys: readonly (keyof T & string)[],
): T[] {
  const sourceById = new Map<string, T & RowWithId>();
  if (sourceRows) {
    for (const row of sourceRows) {
      const id = row.__rowId;
      if (id !== undefined) {
        sourceById.set(id, row);
      }
    }
  }

  return formRows.map((formRow) => {
    const id = formRow.__rowId;
    const source = id !== undefined ? sourceById.get(id) : undefined;
    if (source) {
      const owned = pickOwned<T>(formRow as Record<string, unknown>, ownedKeys);
      const merged = { ...source, ...owned } as T & RowWithId;
      return stripRowId(merged);
    }
    const owned = pickOwned<T>(formRow as Record<string, unknown>, ownedKeys);
    return owned as T;
  });
}

/**
 * Tag each row in `rows` with a fresh `__rowId` (UUID). Returns a shallow-cloned
 * array of objects with the id set; original rows are not mutated.
 *
 * Callers should keep a reference to the tagged rows (e.g. as form values) and
 * pass the same tagged source array to {@link mergePreserveExtras} at save time.
 */
export function tagRowsWithIds<T extends Record<string, unknown>>(
  rows: ReadonlyArray<T> | undefined,
): (T & RowWithId)[] {
  if (!rows) return [];
  return rows.map((row) => ({ ...row, __rowId: createRowId() }));
}

/**
 * Generate a fresh transient row id. Uses `crypto.randomUUID()` when available,
 * with a non-secure fallback for environments where it is not (e.g. older test runners).
 */
export function createRowId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `row_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}
