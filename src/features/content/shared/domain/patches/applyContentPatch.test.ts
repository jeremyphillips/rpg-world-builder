import { describe, expect, it } from 'vitest';
import { applyContentPatch } from './applyContentPatch';

describe('applyContentPatch', () => {
  it('replaces spell components wholesale (same semantics as patch driver merge)', () => {
    const entry = {
      id: 'x',
      components: { verbal: true, somatic: true },
    };
    const merged = applyContentPatch(entry, {
      components: { somatic: true },
    } as Partial<typeof entry>);
    expect(merged.components).toEqual({ somatic: true });
  });
});
