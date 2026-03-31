import { describe, expect, it } from 'vitest';

import {
  deriveLocationMapSelection,
  shouldAutoSwitchRailToMapForMode,
} from './locationEditorRail.types';

describe('deriveLocationMapSelection', () => {
  it('returns none for null', () => {
    expect(deriveLocationMapSelection(null)).toEqual({ type: 'none' });
  });

  it('returns none for empty or whitespace-only id', () => {
    expect(deriveLocationMapSelection('')).toEqual({ type: 'none' });
    expect(deriveLocationMapSelection('   ')).toEqual({ type: 'none' });
  });

  it('returns cell for a non-empty cell id', () => {
    expect(deriveLocationMapSelection('0,0')).toEqual({ type: 'cell', cellId: '0,0' });
  });
});

describe('shouldAutoSwitchRailToMapForMode', () => {
  it('is true only for place mode', () => {
    expect(shouldAutoSwitchRailToMapForMode('place')).toBe(true);
    expect(shouldAutoSwitchRailToMapForMode('select')).toBe(false);
    expect(shouldAutoSwitchRailToMapForMode('paint')).toBe(false);
    expect(shouldAutoSwitchRailToMapForMode('clear-fill')).toBe(false);
    expect(shouldAutoSwitchRailToMapForMode('erase')).toBe(false);
  });
});
