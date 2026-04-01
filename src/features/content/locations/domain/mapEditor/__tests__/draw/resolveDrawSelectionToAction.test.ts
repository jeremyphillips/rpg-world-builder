// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveDrawSelectionToAction } from '../../draw';

describe('resolveDrawSelectionToAction', () => {
  it('returns path action for path category', () => {
    expect(resolveDrawSelectionToAction({ category: 'path', kind: 'road' })).toEqual({
      type: 'path',
      pathKind: 'road',
    });
  });

  it('returns edge action for edge category', () => {
    expect(resolveDrawSelectionToAction({ category: 'edge', kind: 'wall' })).toEqual({
      type: 'edge',
      edgeKind: 'wall',
    });
  });

  it('returns unsupported when null', () => {
    expect(resolveDrawSelectionToAction(null)).toEqual({ type: 'unsupported', reason: 'no_selection' });
  });
});
