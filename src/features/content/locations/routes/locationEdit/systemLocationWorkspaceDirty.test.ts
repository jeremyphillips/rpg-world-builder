import { describe, expect, it } from 'vitest';

import { isSystemLocationWorkspaceDirty } from './systemLocationWorkspaceDirty';

describe('isSystemLocationWorkspaceDirty', () => {
  it('is true when only patch driver is dirty', () => {
    expect(isSystemLocationWorkspaceDirty(true, false)).toBe(true);
  });

  it('is true when only grid draft is dirty', () => {
    expect(isSystemLocationWorkspaceDirty(false, true)).toBe(true);
  });

  it('is false when neither is dirty', () => {
    expect(isSystemLocationWorkspaceDirty(false, false)).toBe(false);
  });
});
