// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { GridCellViewModel } from '@/features/mechanics/domain/combat/space/selectors/space.selectors';

import { resolveCombatCellAffordance } from '../combatCellAffordance';

function baseCell(overrides: Partial<GridCellViewModel> = {}): GridCellViewModel {
  return {
    cellId: 'c-0-0',
    x: 0,
    y: 0,
    kind: 'open',
    occupantId: null,
    occupantLabel: null,
    occupantSide: null,
    occupantPortraitImageKey: null,
    placedObjectKind: null,
    placedObjectVisual: null,
    isActive: false,
    isSelectedTarget: false,
    isWithinSelectedActionRange: false,
    isLegalTargetForSelectedAction: false,
    isHostileSelectedTargetPulse: false,
    isHostileLegalTargetForSelectedAction: false,
    isReachable: false,
    occupantIsDefeated: false,
    occupantRendersToken: false,
    ...overrides,
  };
}

const baseInput = {
  hoveredCellId: null as string | null,
  hasCellClickHandler: true,
  movementHighlightActive: false,
  hasMovementRemaining: false,
  creatureTargetingActive: false,
  singleCellPlacementPickActive: false,
  objectAnchorPickActive: false,
};

describe('resolveCombatCellAffordance', () => {
  it('wall: non-interactive div affordance, default cursor', () => {
    const a = resolveCombatCellAffordance({
      cell: baseCell({ kind: 'wall', cellId: 'w1' }),
      ...baseInput,
      hoveredCellId: 'w1',
    });
    expect(a.interactive).toBe(false);
    expect(a.activatable).toBe(false);
    expect(a.disabled).toBe(false);
    expect(a.cursor).toBe('default');
    expect(a.hoverMode).toBe('none');
  });

  it('walkable with handler: interactive button, pointer when idle', () => {
    const a = resolveCombatCellAffordance({
      cell: baseCell({ cellId: 'c-1-1', isReachable: true }),
      ...baseInput,
    });
    expect(a.interactive).toBe(true);
    expect(a.activatable).toBe(true);
    expect(a.disabled).toBe(false);
    expect(a.cursor).toBe('pointer');
    expect(a.hoverMode).toBe('none');
  });

  it('illegal movement hover: not-allowed, disabled, illegal hoverMode', () => {
    const a = resolveCombatCellAffordance({
      cell: baseCell({ cellId: 'c-2-2', isReachable: false }),
      ...baseInput,
      hoveredCellId: 'c-2-2',
      movementHighlightActive: true,
      hasMovementRemaining: true,
    });
    expect(a.cursor).toBe('not-allowed');
    expect(a.hoverMode).toBe('illegal');
    expect(a.disabled).toBe(true);
    expect(a.activatable).toBe(false);
  });

  it('targeting illegal empty cell: not-allowed and disabled when hovered', () => {
    const a = resolveCombatCellAffordance({
      cell: baseCell({ cellId: 'c-3-3', occupantId: null }),
      ...baseInput,
      hoveredCellId: 'c-3-3',
      creatureTargetingActive: true,
    });
    expect(a.cursor).toBe('not-allowed');
    expect(a.hoverMode).toBe('illegal');
    expect(a.disabled).toBe(true);
  });

  it('no cell click handler: non-interactive', () => {
    const a = resolveCombatCellAffordance({
      cell: baseCell({ isReachable: true }),
      ...baseInput,
      hasCellClickHandler: false,
    });
    expect(a.interactive).toBe(false);
    expect(a.cursor).toBe('default');
  });
});
