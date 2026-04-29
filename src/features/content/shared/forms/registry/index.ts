export type {
  FieldSpec,
  FieldSpecKind,
  FieldSpecOption,
  ValidationRule,
  ValidationSpec,
} from './fieldSpec.types';
export type {
  CustomFormNodeSpec,
  CustomFormNodeSpecContext,
  FormNodeSpec,
  NestedFieldSpec,
  RepeatableGroupSpec,
} from './formNodeSpec.types';
export { isCustomFormNodeSpec, isRepeatableGroupSpec } from './formNodeSpec.types';
export { numberRange } from '@/ui/patterns';
export type {
  DetailSpec,
  DetailSurface,
  DetailPlacement,
  ContentMetaAudience,
  DetailMetaAudience,
  DetailAudience,
} from './detailSpec.types';
export {
  metaAll,
  metaPrivilegedContentMeta,
  metaDmOrPlatformOwner,
  mainOnly,
  structuredMainAndAdvanced,
  structuredAdvancedOnly,
} from './detailSpec.presets';
export {
  isEmptyDetailValue,
  defaultDetailRawRender,
} from './detailSpec.helpers';
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
export {
  buildDetailItemsFromSpecs,
  type BuildDetailItemsFromSpecsOptions,
  type BuildDetailViewer,
} from './buildDetailItemsFromSpecs';
export {
  buildContentDetailSectionsFromSpecs,
  toDetailSpecViewer,
  type BuildContentDetailSectionsFromSpecsArgs,
  type BuildContentDetailSectionsFromSpecsResult,
  type ContentDetailSectionItems,
} from './buildContentDetailSectionsFromSpecs';
export {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
  buildDefaultFormValuesFromFormNodes,
} from './buildMappers';
