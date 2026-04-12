import type { ReactNode } from 'react';

import { getEffectConditionById } from '@/features/content/shared/domain/vocab/effectConditions.vocab';
import type { EffectConditionId } from '@/features/content/shared/domain/vocab/effectConditions.vocab';
import type { DamageType } from '@/features/mechanics/domain/damage/damage.types';
import { DAMAGE_TYPE_ROWS } from '@/features/mechanics/domain/damage/damageTypeUi';
import type { Spell } from '@/features/content/spells/domain/types';
import { SPELL_FUNCTION_TAG_OPTIONS } from '@/features/content/spells/domain/vocab/spellFunctionTags.vocab';
import { SPELL_ROLE_TAG_OPTIONS } from '@/features/content/spells/domain/vocab/spellRoleTags.vocab';

function damageTypeLabel(id: DamageType): string {
  const row = DAMAGE_TYPE_ROWS.find((r) => r.id === id);
  return row?.name ?? id;
}

function roleLabel(id: string): string {
  return SPELL_ROLE_TAG_OPTIONS.find((o) => o.id === id)?.name ?? id;
}

function functionLabel(id: string): string {
  return SPELL_FUNCTION_TAG_OPTIONS.find((o) => o.id === id)?.name ?? id;
}

function conditionLabel(id: EffectConditionId): string {
  return getEffectConditionById(id)?.name ?? id;
}

export function renderSpellDamageEffectsDetailDisplay(spell: Spell): ReactNode {
  const tags = spell.tags;
  if (!tags) return '—';

  const roles = tags.roles ?? [];
  const damageTypes = tags.damageTypes ?? [];
  const hasDamageRole = roles.includes('damage');

  const segments: string[] = [];

  if (hasDamageRole && damageTypes.length > 0) {
    segments.push(`Damage: ${damageTypes.map(damageTypeLabel).join(', ')}`);
  }

  const rolesToLabel =
    hasDamageRole && damageTypes.length > 0
      ? roles.filter((r) => r !== 'damage')
      : roles;

  for (const r of rolesToLabel) {
    segments.push(roleLabel(r));
  }

  if (!hasDamageRole && damageTypes.length > 0) {
    segments.push(damageTypes.map(damageTypeLabel).join(', '));
  }

  for (const f of tags.functions ?? []) {
    segments.push(functionLabel(f));
  }

  for (const c of tags.conditions ?? []) {
    segments.push(conditionLabel(c));
  }

  const text = segments.filter(Boolean).join(', ');
  return text === '' ? '—' : text;
}
