import type { SpellComponents } from '@/features/content/spells/domain/types';
import type { Coin } from '@/shared/money/types';
import { splitComponentsToForm } from '@/features/content/spells/domain/forms/assembly/spellComposite.assembly';
import { SPELL_FORM_DEFAULT_COMPONENTS } from '@/features/content/spells/domain/forms/spellForm.defaults';

function parseCoin(u: string): Coin {
  if (u === 'cp' || u === 'sp' || u === 'ep' || u === 'gp' || u === 'pp') return u;
  return 'gp';
}

function parsePositiveNumber(s: string, fallback: number): number {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Patch driver bindings: UI fields ↔ `Spell.components` (shared with `splitComponentsToForm` / material rules). */
export const spellComponentsPatchBindings = {
  componentIds: {
    domainPath: 'components',
    parse: (domain: unknown) => splitComponentsToForm(domain as SpellComponents).componentIds,
    serialize: (uiValue: unknown, currentDomain: unknown) => {
      const cur = (currentDomain ?? {}) as SpellComponents;
      const ids = Array.isArray(uiValue) ? (uiValue as string[]) : [];
      const out: SpellComponents = {};
      if (ids.includes('verbal')) out.verbal = true;
      if (ids.includes('somatic')) out.somatic = true;
      if (ids.includes('material')) {
        out.material = cur.material ?? { description: 'Material component' };
      }
      return Object.keys(out).length > 0 ? out : { ...SPELL_FORM_DEFAULT_COMPONENTS };
    },
  },
  materialDescription: {
    domainPath: 'components',
    parse: (domain: unknown) => splitComponentsToForm(domain as SpellComponents).materialDescription,
    serialize: (uiValue: unknown, currentDomain: unknown) => {
      const cur = (currentDomain ?? {}) as SpellComponents;
      const desc = String(uiValue ?? '').trim();
      const mat = cur.material ?? { description: 'Material component' };
      return {
        ...cur,
        material: { ...mat, description: desc.length > 0 ? desc : 'Material component' },
      };
    },
  },
  materialCostValue: {
    domainPath: 'components',
    parse: (domain: unknown) => splitComponentsToForm(domain as SpellComponents).materialCostValue,
    serialize: (uiValue: unknown, currentDomain: unknown) => {
      const cur = (currentDomain ?? {}) as SpellComponents;
      const val = parsePositiveNumber(String(uiValue ?? ''), 0);
      const mat = cur.material ?? { description: 'Material component' };
      const unit = (mat.cost?.unit ?? 'gp') as Coin;
      return {
        ...cur,
        material: {
          ...mat,
          ...(val > 0 ? { cost: { value: val, unit, atLeast: true } } : { cost: undefined }),
        },
      };
    },
  },
  materialCostUnit: {
    domainPath: 'components',
    parse: (domain: unknown) => splitComponentsToForm(domain as SpellComponents).materialCostUnit,
    serialize: (uiValue: unknown, currentDomain: unknown) => {
      const cur = (currentDomain ?? {}) as SpellComponents;
      const unit = parseCoin(String(uiValue ?? 'gp'));
      const mat = cur.material ?? { description: 'Material component' };
      const value = mat.cost?.value ?? 0;
      return {
        ...cur,
        material: {
          ...mat,
          ...(value > 0 ? { cost: { value, unit, atLeast: true } } : { cost: undefined }),
        },
      };
    },
  },
  materialConsumed: {
    domainPath: 'components',
    parse: (domain: unknown) => splitComponentsToForm(domain as SpellComponents).materialConsumed,
    serialize: (uiValue: unknown, currentDomain: unknown) => {
      const cur = (currentDomain ?? {}) as SpellComponents;
      const mat = cur.material ?? { description: 'Material component' };
      return {
        ...cur,
        material: { ...mat, consumed: Boolean(uiValue) },
      };
    },
  },
} as const;
