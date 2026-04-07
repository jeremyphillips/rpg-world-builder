// @vitest-environment node
import type { SystemStyleObject } from '@mui/system';
import { describe, expect, it } from 'vitest';

import {
  buildHexAuthoringCellVisualParts,
  buildSquareAuthoringCellVisualParts,
} from '../mapGridAuthoringCellVisual.builder';

/** Narrow MUI `SystemStyleObject` for assertions (tsc otherwise widens to pseudo-selector unions). */
function sxProps(s: SystemStyleObject): Record<string, unknown> {
  return (s ?? {}) as Record<string, unknown>;
}

describe('buildSquareAuthoringCellVisualParts', () => {
  it('uses selected border and inset shadow when selected', () => {
    const { shell } = buildSquareAuthoringCellVisualParts({
      cellId: '0,0',
      selected: true,
      excluded: false,
      fillPresentation: { swatchColor: '#abc' },
      disabled: false,
      selectHoverTarget: undefined,
    });
    const sx = sxProps(shell);
    expect(sx.borderColor).toBeDefined();
    expect(String(sx.boxShadow)).toMatch(/inset/);
  });

  it('uses excluded styling when excluded and not selected', () => {
    const { shell, fillLayer } = buildSquareAuthoringCellVisualParts({
      cellId: '0,0',
      selected: false,
      excluded: true,
      fillPresentation: undefined,
      disabled: false,
      selectHoverTarget: undefined,
    });
    expect(sxProps(shell).borderStyle).toBe('dashed');
    expect(String(sxProps(fillLayer).backgroundImage)).toMatch(/repeating-linear-gradient/);
  });

  it('mirrors idle chrome on hover when select hover is suppressed for this cell', () => {
    const { shell } = buildSquareAuthoringCellVisualParts({
      cellId: '1,0',
      selected: false,
      excluded: false,
      fillPresentation: undefined,
      disabled: false,
      selectHoverTarget: { type: 'cell', cellId: '0,0' },
    });
    const hover = sxProps(shell)['&:hover'] as Record<string, unknown> | undefined;
    expect(hover).toBeDefined();
    expect(hover?.borderColor).toBeDefined();
  });
});

describe('buildHexAuthoringCellVisualParts', () => {
  it('returns outer, inner shell, fill layer, and host hover sx keys for a typical cell', () => {
    const parts = buildHexAuthoringCellVisualParts({
      cellId: '0,0',
      selected: false,
      excluded: false,
      fillPresentation: undefined,
      disabled: false,
      selectHoverTarget: undefined,
      strokePx: '1px',
    });
    expect(sxProps(parts.outer).bgcolor).toBeDefined();
    expect(String(sxProps(parts.innerShell).clipPath)).toMatch(/polygon/);
    expect(parts.fillLayer).toBeDefined();
    expect(parts.hostHoverSx).toBeDefined();
  });
});
