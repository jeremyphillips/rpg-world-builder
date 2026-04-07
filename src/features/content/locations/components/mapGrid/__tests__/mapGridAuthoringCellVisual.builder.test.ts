// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  buildHexAuthoringCellVisualParts,
  buildSquareAuthoringCellVisualSx,
} from '../mapGridAuthoringCellVisual.builder';

describe('buildSquareAuthoringCellVisualSx', () => {
  it('uses selected border and inset shadow when selected', () => {
    const sx = buildSquareAuthoringCellVisualSx({
      cellId: '0,0',
      selected: true,
      excluded: false,
      fillBg: '#abc',
      disabled: false,
      selectHoverTarget: undefined,
    });
    expect(sx.borderColor).toBeDefined();
    expect(sx.boxShadow).toMatch(/inset/);
  });

  it('uses excluded styling when excluded and not selected', () => {
    const sx = buildSquareAuthoringCellVisualSx({
      cellId: '0,0',
      selected: false,
      excluded: true,
      fillBg: undefined,
      disabled: false,
      selectHoverTarget: undefined,
    });
    expect(sx.borderStyle).toBe('dashed');
    expect(sx.backgroundImage).toMatch(/repeating-linear-gradient/);
  });

  it('mirrors idle chrome on hover when select hover is suppressed for this cell', () => {
    const sx = buildSquareAuthoringCellVisualSx({
      cellId: '1,0',
      selected: false,
      excluded: false,
      fillBg: undefined,
      disabled: false,
      selectHoverTarget: { type: 'cell', cellId: '0,0' },
    });
    const hover = sx['&:hover'] as Record<string, unknown> | undefined;
    expect(hover).toBeDefined();
    expect(hover?.borderColor).toBeDefined();
  });
});

describe('buildHexAuthoringCellVisualParts', () => {
  it('returns outer, inner, and host hover sx keys for a typical cell', () => {
    const parts = buildHexAuthoringCellVisualParts({
      cellId: '0,0',
      selected: false,
      excluded: false,
      fillBg: undefined,
      disabled: false,
      selectHoverTarget: undefined,
      strokePx: '1px',
    });
    expect(parts.outer.bgcolor).toBeDefined();
    expect(parts.inner.clipPath).toMatch(/polygon/);
    expect(parts.hostHoverSx).toBeDefined();
  });
});
