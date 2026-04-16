import type { CustomFormNodeSpec } from '@/features/content/shared/forms/registry/formNodeSpec.types';
import { SpellEffectPayloadFields } from '../components/SpellEffectPayloadFields';

export const spellEffectPayloadFormNode: CustomFormNodeSpec = {
  kind: 'custom',
  key: 'spellEffectPayload',
  render: (ctx) => (
    <SpellEffectPayloadFields namePrefix={ctx.rowPrefix} patchDriver={ctx.patchDriver} />
  ),
};
