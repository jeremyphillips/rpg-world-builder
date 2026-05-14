export type MultiSelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  disabled?: boolean;
};

/** Closed-field presentation for multi-select primitives (`summary` vs `chips`). */
export type MultiSelectFieldDisplayMode = 'summary' | 'chips';

export function defaultMultiSelectSummary<TValue extends string>(selected: MultiSelectOption<TValue>[]) {
  const n = selected.length;
  if (n === 0) return 'None selected';
  if (n === 1) return '1 selected';
  return `${n} selected`;
}

export function getSelectedMultiSelectOptions<TValue extends string>(
  value: TValue[],
  options: MultiSelectOption<TValue>[],
): MultiSelectOption<TValue>[] {
  const by = new Map<TValue, MultiSelectOption<TValue>>();
  for (const o of options) {
    by.set(o.value, o);
  }
  const out: MultiSelectOption<TValue>[] = [];
  for (const v of value) {
    const o = by.get(v);
    if (o) out.push(o);
  }
  return out;
}
