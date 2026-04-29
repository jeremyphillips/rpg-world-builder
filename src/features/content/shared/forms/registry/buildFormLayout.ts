import type { FormLayoutNode, RepeatableGroupLayoutConfig } from '@/ui/patterns';
import type { FieldSpec } from './fieldSpec.types';
import type { FormNodeSpec, RepeatableGroupSpec } from './formNodeSpec.types';
import { isCustomFormNodeSpec, isRepeatableGroupSpec } from './formNodeSpec.types';
import { fieldSpecToFieldConfig, type BuildFieldConfigsOptions } from './buildFieldConfigs';

function mapRepeatableSpec<
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown>,
  ItemShape extends Record<string, unknown>,
>(
  spec: RepeatableGroupSpec<FormValues, InputShape, ItemShape>,
  options: BuildFieldConfigsOptions,
): RepeatableGroupLayoutConfig {
  return {
    type: 'repeatable-group',
    name: spec.name,
    label: spec.label,
    itemLabel: spec.itemLabel,
    ...(spec.defaultItem !== undefined && { defaultItem: spec.defaultItem }),
    ...(spec.patchBinding !== undefined && { patchBinding: spec.patchBinding }),
    children: buildFormLayout(spec.children, options),
  };
}

/**
 * Converts FormNodeSpec tree → FormLayoutNode[] for DynamicFormRenderer.
 */
export function buildFormLayout<
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown> = Record<string, unknown>,
  ItemShape extends Record<string, unknown> = Record<string, unknown>,
>(
  specs: readonly FormNodeSpec<FormValues, InputShape, ItemShape>[],
  options: BuildFieldConfigsOptions = {},
): FormLayoutNode[] {
  const out: FormLayoutNode[] = [];

  for (const spec of specs) {
    if (isRepeatableGroupSpec(spec)) {
      out.push(mapRepeatableSpec(spec, options));
      continue;
    }
    if (isCustomFormNodeSpec(spec)) {
      out.push({
        type: 'custom',
        key: spec.key,
        render: spec.render,
      });
      continue;
    }
    const fc = fieldSpecToFieldConfig(spec as FieldSpec<FormValues, InputShape, ItemShape>, options);
    if (fc) out.push(fc);
  }

  return out;
}
