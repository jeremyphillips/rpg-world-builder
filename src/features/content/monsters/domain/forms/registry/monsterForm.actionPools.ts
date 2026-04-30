/**
 * Phase 5: split monster action pools into per-kind repeatable groups
 * (`special` / `natural`; `weapon` rows pass through untouched). Legendary
 * block uses the same idea for inline specials/naturals; references and inline
 * weapon actions are passthrough.
 */

import type {
  RepeatableGroupSpec,
  NestedFieldSpec,
} from '@/features/content/shared/forms/registry';
import {
  createRowId,
  mergePreserveExtras,
  tagRowsWithIds,
  type RowWithId,
} from '@/features/content/shared/forms/assembly/mergePreserveExtras';
import type {
  MonsterFormValues,
  MonsterLegendaryNaturalInlineFormRow,
  MonsterLegendarySpecialInlineFormRow,
} from '../types/monsterForm.types';
import type { Monster, MonsterInput } from '@/features/content/monsters/domain/types';
import type {
  MonsterAction,
  MonsterNaturalAttackAction,
  MonsterSpecialAction,
} from '@/features/content/monsters/domain/types/monster-actions.types';
import type {
  MonsterLegendaryAction,
  MonsterLegendaryActions,
} from '@/features/content/monsters/domain/types/monster-legendary.types';

const SPECIAL_OWNED_KEYS = ['name', 'description'] as const satisfies readonly (keyof MonsterSpecialAction &
  string)[];
const NATURAL_OWNED_KEYS = ['name'] as const satisfies readonly (keyof MonsterNaturalAttackAction & string)[];

export type MonsterMechanicsActionRowWithId = MonsterAction & RowWithId;
type LegendaryTagged = MonsterLegendaryAction & RowWithId;

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function isMonsterAction(v: unknown): v is MonsterAction {
  return isRecord(v) && (v.kind === 'special' || v.kind === 'natural' || v.kind === 'weapon');
}

function isLegendaryInline(
  e: MonsterLegendaryAction,
): e is Extract<MonsterLegendaryAction, { kind: 'inline' }> {
  return e.kind === 'inline';
}

/** @internal */
export function monsterActionPoolFilterByKind(
  domainValue: unknown,
  kind: 'special' | 'natural',
): MonsterMechanicsActionRowWithId[] {
  if (!Array.isArray(domainValue)) return [];
  const rows = domainValue
    .filter(isMonsterAction)
    .filter((a) => a.kind === kind) as MonsterMechanicsActionRowWithId[];
  return tagRowsWithIds(rows as readonly Record<string, unknown>[]) as MonsterMechanicsActionRowWithId[];
}

function attachRowIdsToMerged<T extends Record<string, unknown>>(
  formRows: ReadonlyArray<RowWithId & Partial<T>>,
  merged: T[],
): (T & RowWithId)[] {
  return merged.map((row, i) => ({
    ...row,
    __rowId: formRows[i]?.__rowId ?? createRowId(),
  })) as (T & RowWithId)[];
}

function normalizeNewSpecial(row: MonsterSpecialAction): MonsterSpecialAction {
  if (row.kind === 'special') return row;
  return {
    kind: 'special',
    name: row.name ?? '',
    description: row.description ?? '',
  };
}

function normalizeNewNatural(row: MonsterNaturalAttackAction): MonsterNaturalAttackAction {
  if (row.kind === 'natural') return row;
  return {
    kind: 'natural',
    name: row.name,
    attackType: 'slam',
    damage: 1,
  };
}

/**
 * Stitch merged specials/naturals back into the previous interleaved ordering
 * (weapons untouched). Drops deleted rows by id and appends brand-new trailing
 * rows after the anchored sequence.
 */
function combineMechanicsMonsterActionsPreserveOrder(
  prevOrder: MonsterMechanicsActionRowWithId[],
  specialsTagged: MonsterMechanicsActionRowWithId[],
  naturalsTagged: MonsterMechanicsActionRowWithId[],
): MonsterMechanicsActionRowWithId[] {
  const unmatchedSpecialIds = new Set<string>();
  const unmatchedNaturalIds = new Set<string>();
  for (const s of specialsTagged) {
    const id = (s as RowWithId).__rowId;
    if (typeof id === 'string' && id.length > 0) unmatchedSpecialIds.add(id);
  }
  for (const n of naturalsTagged) {
    const id = (n as RowWithId).__rowId;
    if (typeof id === 'string' && id.length > 0) unmatchedNaturalIds.add(id);
  }

  const out: MonsterMechanicsActionRowWithId[] = [];

  for (const row of prevOrder) {
    if (!isMonsterAction(row)) continue;

    if (row.kind === 'weapon') {
      out.push(row);
      continue;
    }

    const id = (row as RowWithId).__rowId;
    if (typeof id !== 'string' || id.length === 0) continue;

    if (row.kind === 'special') {
      const merged = specialsTagged.find((s) => (s as RowWithId).__rowId === id);
      if (merged) {
        out.push(merged);
        unmatchedSpecialIds.delete(id);
      }
      continue;
    }

    if (row.kind === 'natural') {
      const merged = naturalsTagged.find((n) => (n as RowWithId).__rowId === id);
      if (merged) {
        out.push(merged);
        unmatchedNaturalIds.delete(id);
      }
    }
  }

  for (const s of specialsTagged) {
    const id = (s as RowWithId).__rowId;
    if (typeof id === 'string' && unmatchedSpecialIds.has(id)) {
      out.push(s);
      unmatchedSpecialIds.delete(id);
    }
  }
  for (const n of naturalsTagged) {
    const id = (n as RowWithId).__rowId;
    if (typeof id === 'string' && unmatchedNaturalIds.has(id)) {
      out.push(n);
      unmatchedNaturalIds.delete(id);
    }
  }

  return out;
}

/**
 * Patch serialize: merge one slice (`special` | `natural`) from the form into
 * `mechanics.actions` / `mechanics.bonusActions`, preserving weapon rows and the
 * previous interleaved order of specials/naturals.
 */
export function rebuildMechanicsMonsterActionsArray(
  which: 'special' | 'natural',
  uiValue: unknown,
  currentDomainValue: unknown,
): MonsterMechanicsActionRowWithId[] {
  const formRows = Array.isArray(uiValue)
    ? (uiValue as ReadonlyArray<RowWithId & Partial<MonsterSpecialAction | MonsterNaturalAttackAction>>)
    : [];
  const cur = Array.isArray(currentDomainValue)
    ? (currentDomainValue as MonsterMechanicsActionRowWithId[])
    : [];

  const specialsTagged = cur.filter((a) => a.kind === 'special');
  const naturalsTagged = cur.filter((a) => a.kind === 'natural');

  const sourceSpecials = specialsTagged as ReadonlyArray<MonsterSpecialAction & RowWithId>;
  const sourceNaturals = naturalsTagged as ReadonlyArray<MonsterNaturalAttackAction & RowWithId>;

  let nextSpecialTagged: MonsterMechanicsActionRowWithId[] = [...specialsTagged];
  let nextNaturalTagged: MonsterMechanicsActionRowWithId[] = [...naturalsTagged];

  if (which === 'special') {
    const merged = mergePreserveExtras<MonsterSpecialAction>(formRows, sourceSpecials, SPECIAL_OWNED_KEYS).map(
      normalizeNewSpecial,
    );
    nextSpecialTagged = attachRowIdsToMerged(formRows, merged) as MonsterMechanicsActionRowWithId[];
  } else {
    const merged = mergePreserveExtras<MonsterNaturalAttackAction>(
      formRows,
      sourceNaturals,
      NATURAL_OWNED_KEYS,
    ).map(normalizeNewNatural);
    nextNaturalTagged = attachRowIdsToMerged(formRows, merged) as MonsterMechanicsActionRowWithId[];
  }

  return combineMechanicsMonsterActionsPreserveOrder(cur, nextSpecialTagged, nextNaturalTagged);
}

type PoolFormKeys = {
  specialName: keyof MonsterFormValues;
  naturalName: keyof MonsterFormValues;
};

function mechanicsDualPool(opts: {
  domainPath: 'mechanics.actions' | 'mechanics.bonusActions';
  labels: { special: string; natural: string };
  itemLabels: { special: string; natural: string };
  keys: PoolFormKeys;
}): [
  RepeatableGroupSpec<MonsterFormValues, MonsterInput & Record<string, unknown>, Monster & Record<string, unknown>>,
  RepeatableGroupSpec<MonsterFormValues, MonsterInput & Record<string, unknown>, Monster & Record<string, unknown>>,
] {
  type N = NestedFieldSpec<
    MonsterFormValues,
    MonsterInput & Record<string, unknown>,
    Monster & Record<string, unknown>
  >;

  const childrenSpecial: N[] = [
    { name: '__rowId', label: '', kind: 'text', skipInForm: true, defaultValue: '' },
    { name: 'name', label: 'Name', kind: 'text', required: true, defaultValue: '' },
    {
      name: 'description',
      label: 'Description',
      kind: 'textarea',
      defaultValue: '',
      minRows: 2,
      maxRows: 8,
    },
  ];

  const childrenNatural: N[] = [
    { name: '__rowId', label: '', kind: 'text', skipInForm: true, defaultValue: '' },
    { name: 'name', label: 'Name', kind: 'text', required: true, defaultValue: '' },
  ];

  const path = opts.domainPath;

  const specialGroup: RepeatableGroupSpec<
    MonsterFormValues,
    MonsterInput & Record<string, unknown>,
    Monster & Record<string, unknown>
  > = {
    kind: 'repeatable-group',
    name: opts.keys.specialName,
    label: opts.labels.special,
    itemLabel: opts.itemLabels.special,
    defaultItem: { __rowId: '', name: '', description: '' },
    children: childrenSpecial,
    patchBinding: {
      domainPath: path,
      parse: (domainValue: unknown) => monsterActionPoolFilterByKind(domainValue, 'special'),
      serialize: (uiValue, cur) => rebuildMechanicsMonsterActionsArray('special', uiValue, cur),
    },
  };

  const naturalGroup: RepeatableGroupSpec<
    MonsterFormValues,
    MonsterInput & Record<string, unknown>,
    Monster & Record<string, unknown>
  > = {
    kind: 'repeatable-group',
    name: opts.keys.naturalName,
    label: opts.labels.natural,
    itemLabel: opts.itemLabels.natural,
    defaultItem: { __rowId: '', name: '' },
    children: childrenNatural,
    patchBinding: {
      domainPath: path,
      parse: (domainValue: unknown) => monsterActionPoolFilterByKind(domainValue, 'natural'),
      serialize: (uiValue, cur) => rebuildMechanicsMonsterActionsArray('natural', uiValue, cur),
    },
  };

  return [specialGroup, naturalGroup];
}

/** `mechanics.actions` pools. */
export const [monsterMechanicsSpecialActionsGroup, monsterMechanicsNaturalActionsGroup] = mechanicsDualPool({
  domainPath: 'mechanics.actions',
  labels: { special: 'Actions — special', natural: 'Actions — natural attacks' },
  itemLabels: { special: 'Special action', natural: 'Natural attack' },
  keys: { specialName: 'specialActions', naturalName: 'naturalActions' },
});

/** `mechanics.bonusActions` pools. */
export const [monsterMechanicsBonusSpecialActionsGroup, monsterMechanicsBonusNaturalActionsGroup] =
  mechanicsDualPool({
    domainPath: 'mechanics.bonusActions',
    labels: { special: 'Bonus actions — special', natural: 'Bonus actions — natural attacks' },
    itemLabels: { special: 'Special bonus action', natural: 'Natural bonus attack' },
    keys: { specialName: 'bonusSpecialActions', naturalName: 'bonusNaturalActions' },
  });

export function filterLegendaryInlineByActionKind(
  block: MonsterLegendaryActions | undefined,
  actionKind: 'special' | 'natural',
): LegendaryTagged[] {
  const actions = block?.actions ?? [];
  const rows = actions.filter((e): e is LegendaryTagged => {
    if (!isLegendaryInline(e) || !isMonsterAction(e.action)) return false;
    return e.action.kind === actionKind;
  }) as LegendaryTagged[];
  return tagRowsWithIds(rows as readonly Record<string, unknown>[]) as LegendaryTagged[];
}

export function legendaryInlineSpecialsToFormRows(
  entries: LegendaryTagged[],
): MonsterLegendarySpecialInlineFormRow[] {
  return entries.map((e) => {
    if (!isLegendaryInline(e) || !isMonsterAction(e.action) || e.action.kind !== 'special') {
      return { __rowId: (e as LegendaryTagged).__rowId ?? '', name: '', description: '' };
    }
    return {
      __rowId: (e as LegendaryTagged).__rowId ?? '',
      name: e.name ?? '',
      description: e.action.description ?? '',
    };
  });
}

export function legendaryInlineNaturalsToFormRows(entries: LegendaryTagged[]): MonsterLegendaryNaturalInlineFormRow[] {
  return entries.map((e) => {
    if (!isLegendaryInline(e) || !isMonsterAction(e.action) || e.action.kind !== 'natural') {
      return { __rowId: (e as LegendaryTagged).__rowId ?? '', name: '' };
    }
    const inner = e.action;
    return {
      __rowId: (e as LegendaryTagged).__rowId ?? '',
      name: inner.name ?? inner.attackType ?? '',
    };
  });
}

function mergeLegendaryInlineSpecialForms(
  formRows: MonsterLegendarySpecialInlineFormRow[],
  sources: LegendaryTagged[],
): LegendaryTagged[] {
  const byId = new Map<string, LegendaryTagged>();
  for (const s of sources) {
    const id = s.__rowId;
    if (typeof id === 'string' && id.length > 0) byId.set(id, s);
  }
  return formRows.map((fr) => {
    const src = fr.__rowId !== undefined ? byId.get(fr.__rowId) : undefined;
    if (src && isLegendaryInline(src) && isMonsterAction(src.action) && src.action.kind === 'special') {
      return {
        ...src,
        __rowId: fr.__rowId,
        name: fr.name,
        action: {
          ...src.action,
          name: fr.name,
          description: fr.description,
        },
      } as LegendaryTagged;
    }
    return {
      kind: 'inline' as const,
      name: fr.name,
      __rowId: fr.__rowId ?? createRowId(),
      action: {
        kind: 'special' as const,
        name: fr.name,
        description: fr.description ?? '',
      },
    } as LegendaryTagged;
  });
}

function mergeLegendaryInlineNaturalForms(
  formRows: MonsterLegendaryNaturalInlineFormRow[],
  sources: LegendaryTagged[],
): LegendaryTagged[] {
  const byId = new Map<string, LegendaryTagged>();
  for (const s of sources) {
    const id = s.__rowId;
    if (typeof id === 'string' && id.length > 0) byId.set(id, s);
  }
  return formRows.map((fr) => {
    const src = fr.__rowId !== undefined ? byId.get(fr.__rowId) : undefined;
    if (src && isLegendaryInline(src) && isMonsterAction(src.action) && src.action.kind === 'natural') {
      return {
        ...src,
        __rowId: fr.__rowId,
        name: fr.name,
        action: {
          ...src.action,
          name: fr.name,
        },
      } as LegendaryTagged;
    }
    return {
      kind: 'inline' as const,
      name: fr.name,
      __rowId: fr.__rowId ?? createRowId(),
      action: normalizeNewNatural({
        kind: 'natural',
        name: fr.name,
        attackType: 'slam',
        damage: 1,
      }),
    } as LegendaryTagged;
  });
}

function legendaryPassthroughEntry(e: MonsterLegendaryAction): boolean {
  return e.kind === 'reference' || (isLegendaryInline(e) && isMonsterAction(e.action) && e.action.kind === 'weapon');
}

function combineLegendaryActionsPreserveOrder(
  prev: LegendaryTagged[],
  specialsMerged: LegendaryTagged[],
  naturalsMerged: LegendaryTagged[],
): LegendaryTagged[] {
  const unmatchedSpec = new Set(
    specialsMerged
      .map((s) => s.__rowId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  );
  const unmatchedNat = new Set(
    naturalsMerged
      .map((n) => n.__rowId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  );

  const out: LegendaryTagged[] = [];

  for (const row of prev) {
    if (legendaryPassthroughEntry(row)) {
      out.push(row);
      continue;
    }
    const id = row.__rowId;
    if (typeof id !== 'string' || id.length === 0) continue;

    if (row.kind === 'inline' && isMonsterAction(row.action) && row.action.kind === 'special') {
      const merged = specialsMerged.find((s) => s.__rowId === id);
      if (merged) {
        out.push(merged);
        unmatchedSpec.delete(id);
      }
      continue;
    }
    if (row.kind === 'inline' && isMonsterAction(row.action) && row.action.kind === 'natural') {
      const merged = naturalsMerged.find((n) => n.__rowId === id);
      if (merged) {
        out.push(merged);
        unmatchedNat.delete(id);
      }
    }
  }

  for (const s of specialsMerged) {
    const id = s.__rowId;
    if (typeof id === 'string' && unmatchedSpec.has(id)) {
      out.push(s);
      unmatchedSpec.delete(id);
    }
  }
  for (const n of naturalsMerged) {
    const id = n.__rowId;
    if (typeof id === 'string' && unmatchedNat.has(id)) {
      out.push(n);
      unmatchedNat.delete(id);
    }
  }

  return out;
}


export function rebuildLegendaryActionsFromSplit(
  which: 'special' | 'natural',
  uiValue: unknown,
  currentDomainValue: unknown,
): MonsterLegendaryActions {
  const curBlock =
    currentDomainValue != null && typeof currentDomainValue === 'object' && !Array.isArray(currentDomainValue)
      ? (currentDomainValue as MonsterLegendaryActions)
      : undefined;

  const base: MonsterLegendaryActions = curBlock ?? { uses: 0, actions: [] };
  const actions = base.actions ?? [];
  const prevActs = actions as LegendaryTagged[];

  const inlineSpecialTagged = actions.filter((e): e is LegendaryTagged => {
    if (!isLegendaryInline(e) || !isMonsterAction(e.action)) return false;
    return e.action.kind === 'special';
  }) as LegendaryTagged[];

  const inlineNaturalTagged = actions.filter((e): e is LegendaryTagged => {
    if (!isLegendaryInline(e) || !isMonsterAction(e.action)) return false;
    return e.action.kind === 'natural';
  }) as LegendaryTagged[];

  let mergedSpecial: LegendaryTagged[] = [...inlineSpecialTagged];
  let mergedNatural: LegendaryTagged[] = [...inlineNaturalTagged];

  const formRows = Array.isArray(uiValue) ? uiValue : [];

  if (which === 'special') {
    mergedSpecial = mergeLegendaryInlineSpecialForms(
      formRows as MonsterLegendarySpecialInlineFormRow[],
      inlineSpecialTagged,
    );
  } else {
    mergedNatural = mergeLegendaryInlineNaturalForms(
      formRows as MonsterLegendaryNaturalInlineFormRow[],
      inlineNaturalTagged,
    );
  }

  const joint = combineLegendaryActionsPreserveOrder(prevActs, mergedSpecial, mergedNatural).map((e) => ({
    ...e,
    __rowId: (e as LegendaryTagged).__rowId ?? createRowId(),
  }));

  return {
    ...base,
    actions: joint,
  };
}

const legendarySpecialChildren: NestedFieldSpec<
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
>[] = [
  { name: '__rowId', label: '', kind: 'text', skipInForm: true, defaultValue: '' },
  { name: 'name', label: 'Name', kind: 'text', required: true, defaultValue: '' },
  {
    name: 'description',
    label: 'Description',
    kind: 'textarea',
    defaultValue: '',
    minRows: 2,
    maxRows: 8,
  },
];

const legendaryNaturalChildren: NestedFieldSpec<
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
>[] = [
  { name: '__rowId', label: '', kind: 'text', skipInForm: true, defaultValue: '' },
  { name: 'name', label: 'Name', kind: 'text', required: true, defaultValue: '' },
];

/** Legendary — inline special actions (`mechanics.legendaryActions.actions`). */
export const monsterLegendarySpecialActionsGroup: RepeatableGroupSpec<
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
> = {
  kind: 'repeatable-group',
  name: 'legendarySpecialActions',
  label: 'Legendary actions — special (inline)',
  itemLabel: 'Legendary special action',
  defaultItem: { __rowId: '', name: '', description: '' },
  children: legendarySpecialChildren,
  patchBinding: {
    domainPath: 'mechanics.legendaryActions',
    parse: (domainValue: unknown) =>
      legendaryInlineSpecialsToFormRows(
        filterLegendaryInlineByActionKind(domainValue as MonsterLegendaryActions | undefined, 'special'),
      ),
    serialize: (uiValue, cur) => rebuildLegendaryActionsFromSplit('special', uiValue, cur),
  },
};

/** Legendary — inline natural attacks (`mechanics.legendaryActions.actions`). */
export const monsterLegendaryNaturalActionsGroup: RepeatableGroupSpec<
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
> = {
  kind: 'repeatable-group',
  name: 'legendaryNaturalActions',
  label: 'Legendary actions — natural (inline)',
  itemLabel: 'Legendary natural attack',
  defaultItem: { __rowId: '', name: '' },
  children: legendaryNaturalChildren,
  patchBinding: {
    domainPath: 'mechanics.legendaryActions',
    parse: (domainValue: unknown) =>
      legendaryInlineNaturalsToFormRows(
        filterLegendaryInlineByActionKind(domainValue as MonsterLegendaryActions | undefined, 'natural'),
      ),
    serialize: (uiValue, cur) => rebuildLegendaryActionsFromSplit('natural', uiValue, cur),
  },
};

export const LEGENDARY_META_KEYS = [
  'uses',
  'usesInLair',
  'timing',
  'refresh',
  'resolution',
] as const satisfies readonly (keyof MonsterLegendaryActions)[];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Stable JSON textarea for economies / timing (`actions[]` omitted). */
export function stringifyLegendaryMetaEnvelope(
  block: MonsterLegendaryActions | Record<string, unknown> | undefined,
): string {
  if (!isPlainObject(block)) {
    return JSON.stringify({ uses: 0 }, null, 2);
  }
  const o: Record<string, unknown> = {};
  for (const k of LEGENDARY_META_KEYS) {
    if (k in block) {
      const v = (block as Record<string, unknown>)[k];
      if (v !== undefined) o[k as string] = v;
    }
  }
  if (!('uses' in o)) o.uses = 0;
  return JSON.stringify(o, null, 2);
}

/** Parse author JSON for `{ uses, timing, … }` (drops `actions`). */
export function parseLegendaryMetaJsonText(text: unknown): Partial<MonsterLegendaryActions> {
  const raw = String(text ?? '').trim();
  if (raw === '') return {};
  try {
    const v: unknown = JSON.parse(raw);
    if (!isPlainObject(v)) return {};
    const out: Partial<MonsterLegendaryActions> = {};
    for (const k of LEGENDARY_META_KEYS) {
      if (k in v && v[k] !== undefined) {
        (out as Record<string, unknown>)[k] = v[k];
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** True when a legendary block carries real content worth persisting. */
export function isNontrivialLegendaryBlock(block: MonsterLegendaryActions | undefined): boolean {
  if (!block) return false;
  if ((block.actions?.length ?? 0) > 0) return true;
  if (typeof block.uses === 'number' && block.uses !== 0) return true;
  if (block.usesInLair != null && block.usesInLair !== 0) return true;
  if (block.timing != null) return true;
  if (block.refresh != null) return true;
  if (block.resolution != null && Object.keys(block.resolution).length > 0) return true;
  return false;
}
