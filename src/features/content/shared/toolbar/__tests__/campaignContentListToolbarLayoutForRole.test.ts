import { describe, expect, it } from 'vitest';

import { SPELL_LIST_TOOLBAR_LAYOUT } from '@/features/content/spells/domain/list';

import { campaignContentToolbarLayoutForRole } from '../campaignContentListToolbarLayoutForRole';

describe('campaignContentToolbarLayoutForRole', () => {
  it('keeps owned for PCs and dmOwnedByCharacter for DMs', () => {
    const pcLayout = campaignContentToolbarLayoutForRole(SPELL_LIST_TOOLBAR_LAYOUT, false);
    expect(pcLayout.secondary).toContain('owned');
    expect(pcLayout.secondary).not.toContain('dmOwnedByCharacter');

    const dmLayout = campaignContentToolbarLayoutForRole(SPELL_LIST_TOOLBAR_LAYOUT, true);
    expect(dmLayout.secondary).toContain('dmOwnedByCharacter');
    expect(dmLayout.secondary).not.toContain('owned');
  });
});
