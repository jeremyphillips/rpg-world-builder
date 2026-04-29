import type { SpellBase } from '@/features/content/spells/domain/types';

export type SpellEntry = Partial<SpellBase> & Pick<
  SpellBase,
  'id' | 'name' | 'school' | 'level' | 'classes' | 'effectGroups'
>;
