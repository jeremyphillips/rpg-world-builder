export type {
  FieldSpec,
  FieldSpecKind,
  FieldSpecOption,
  ValidationRule,
  ValidationSpec,
} from './fieldSpec.types';
export { numberRange } from '@/ui/patterns';
export type { DetailSpec } from './detailSpec.types';
export { buildFieldConfigs, type BuildFieldConfigsOptions } from './buildFieldConfigs';
export {
  buildDetailItems,
  type BuildDetailItemsOptions,
} from './buildDetailItems';
export { buildDetailItemsFromSpecs } from './buildDetailItemsFromSpecs';
export {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
} from './buildMappers';
