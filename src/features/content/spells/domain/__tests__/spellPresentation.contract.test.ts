import { describe, expect, it } from 'vitest';

import { SPELL_DETAIL_SPECS } from '../details/spellDetail.spec';
import { getSpellFormFields } from '../forms/registry/spellForm.registry';
import { buildSpellCustomFilters } from '../list/spellList.filters';
import { SPELL_CORE_UI } from '../spellPresentation';

const coreKeys = [
  SPELL_CORE_UI.school.key,
  SPELL_CORE_UI.level.key,
  SPELL_CORE_UI.classes.key,
] as const;

describe('spellPresentation contract', () => {
  it('form fields include core keys', () => {
    const keys = new Set(getSpellFormFields().map((f) => f.name));
    for (const k of coreKeys) {
      expect(keys.has(k)).toBe(true);
    }
  });

  it('detail specs include core keys', () => {
    const keys = new Set(SPELL_DETAIL_SPECS.map((s) => s.key));
    for (const k of coreKeys) {
      expect(keys.has(k)).toBe(true);
    }
  });

  it('list filters include core ids', () => {
    const filters = buildSpellCustomFilters([], undefined);
    const ids = filters.map((f) => f.id);
    for (const k of coreKeys) {
      expect(ids).toContain(k);
    }
  });
});
