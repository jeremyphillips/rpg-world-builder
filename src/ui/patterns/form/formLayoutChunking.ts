import type { FieldConfig, FormLayoutNode } from './form.types';

export type FormLayoutChunk =
  | { type: 'single'; field: FieldConfig }
  | {
      type: 'group';
      fields: FieldConfig[];
      direction: 'row' | 'column';
      label?: string;
      helperText?: string;
      spacing?: number;
    }
  | { type: 'repeatable'; group: Extract<FormLayoutNode, { type: 'repeatable-group' }> }
  | { type: 'custom'; node: Extract<FormLayoutNode, { type: 'custom' }> };

export function getAutoGroupWidth(count: number): number {
  if (count <= 1) return 12;
  return Math.floor(12 / count);
}

/**
 * Chunks consecutive fields with the same `group.id` (matches DynamicFormRenderer behavior).
 */
export function chunkFormLayoutNodes(fields: FormLayoutNode[]): FormLayoutChunk[] {
  const chunks: FormLayoutChunk[] = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if ('type' in f && f.type === 'custom') {
      chunks.push({ type: 'custom', node: f });
      i++;
      continue;
    }
    if ('type' in f && f.type === 'repeatable-group') {
      chunks.push({ type: 'repeatable', group: f });
      i++;
      continue;
    }
    const fc = f as FieldConfig;
    if (fc.type === 'hidden' || !fc.group) {
      chunks.push({ type: 'single', field: fc });
      i++;
      continue;
    }
    const groupId = fc.group!.id;
    const groupFields: FieldConfig[] = [];
    const direction = fc.group.direction ?? 'row';
    const label = fc.group.label;
    const helperText = fc.group.helperText;
    const spacing = fc.group.spacing;
    while (i < fields.length) {
      const g = fields[i];
      if ('type' in g && g.type === 'repeatable-group') break;
      if ('type' in g && g.type === 'custom') break;
      const fg = g as FieldConfig;
      if (!fg.group || fg.group.id !== groupId) break;
      groupFields.push(fg);
      i++;
    }
    chunks.push({ type: 'group', fields: groupFields, direction, label, helperText, spacing });
  }
  return chunks;
}
