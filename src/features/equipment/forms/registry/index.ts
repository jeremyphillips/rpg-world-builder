// TODO: Remove shim after updating any remaining imports to @/features/content/forms/registry.
export type {
  FieldSpec,
  FieldSpecKind,
  FieldSpecOption,
  ValidationRule,
  ValidationSpec,
  DetailSpec,
} from '@/features/content/forms/registry';
export {
  numberRange,
  buildFieldConfigs,
  buildDetailItems,
  buildDetailItemsFromSpecs,
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
} from '@/features/content/forms/registry';
export type {
  BuildFieldConfigsOptions,
  BuildDetailItemsOptions,
} from '@/features/content/forms/registry';
