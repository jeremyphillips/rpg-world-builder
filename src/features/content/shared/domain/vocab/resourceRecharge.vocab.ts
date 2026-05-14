/**
 * ResourceEffect.recharge values for authoring pickers.
 */
export const RESOURCE_RECHARGE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'short-rest', label: 'Short rest' },
  { value: 'long-rest', label: 'Long rest' },
] as const;

export type ResourceRechargeKind = (typeof RESOURCE_RECHARGE_OPTIONS)[number]['value'];
