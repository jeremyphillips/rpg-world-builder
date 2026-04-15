export type {
  FieldSpec,
  FieldSpecKind,
  FieldSpecOption,
  ValidationRule,
  ValidationSpec,
} from './fieldSpec.types';
export type {
  FormNodeSpec,
  NestedFieldSpec,
  RepeatableGroupSpec,
} from './formNodeSpec.types';
export { isRepeatableGroupSpec } from './formNodeSpec.types';
export { numberRange } from '@/ui/patterns';
export type { DetailSpec } from './detailSpec.types';
export {
  buildFieldConfigs,
  fieldSpecToFieldConfig,
  type BuildFieldConfigsOptions,
} from './buildFieldConfigs';
export { buildFormLayout } from './buildFormLayout';
export {
  buildDetailItems,
  type BuildDetailItemsOptions,
} from './buildDetailItems';
export { buildDetailItemsFromSpecs } from './buildDetailItemsFromSpecs';
export {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
  buildDefaultFormValuesFromFormNodes,
} from './buildMappers';
