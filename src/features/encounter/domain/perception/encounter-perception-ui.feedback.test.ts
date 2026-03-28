import { describe, expect, it } from 'vitest'

import { deriveEncounterPerceptionUiFeedback } from './encounter-perception-ui.feedback'

describe('deriveEncounterPerceptionUiFeedback', () => {
  it('selected-combatant mode uses same POV copy as active-combatant (not DM overview)', () => {
    const f = deriveEncounterPerceptionUiFeedback({
      simulatorViewerMode: 'selected-combatant',
      presentationViewerDisplayLabel: 'Rogue',
      gridPerception: undefined,
    })
    expect(f.povLine).toBe('Viewing as: Rogue')
  })

  it('active-combatant mode shows Viewing as label', () => {
    const f = deriveEncounterPerceptionUiFeedback({
      simulatorViewerMode: 'active-combatant',
      presentationViewerDisplayLabel: 'Wizard',
      gridPerception: {
        battlefieldRender: {
          useBlindVeil: false,
          suppressDarknessBoundaryFromInside: false,
          suppressAoeTemplateOverlay: false,
          blindVeilOpacity: 0,
        },
        viewerCellId: 'c-0-0',
        viewerCombatantId: 'wiz',
      },
    })
    expect(f.povLine).toBe('Viewing as: Wizard')
    expect(f.magicalDarknessLine).toBeNull()
  })

  it('shows magical darkness line only when battlefieldRender.useBlindVeil is true', () => {
    const f = deriveEncounterPerceptionUiFeedback({
      simulatorViewerMode: 'active-combatant',
      presentationViewerDisplayLabel: 'Wizard',
      gridPerception: {
        battlefieldRender: {
          useBlindVeil: true,
          suppressDarknessBoundaryFromInside: true,
          suppressAoeTemplateOverlay: true,
          blindVeilOpacity: 0.82,
        },
        viewerCellId: 'c-0-0',
        viewerCombatantId: 'wiz',
      },
    })
    expect(f.magicalDarknessLine).toContain('magical darkness')
    expect(f.visibilityHint).toContain('occupants')
  })

  it('DM mode never shows magical darkness restriction messaging', () => {
    const f = deriveEncounterPerceptionUiFeedback({
      simulatorViewerMode: 'dm',
      presentationViewerDisplayLabel: 'Wizard',
      gridPerception: {
        battlefieldRender: {
          useBlindVeil: true,
          suppressDarknessBoundaryFromInside: true,
          suppressAoeTemplateOverlay: true,
          blindVeilOpacity: 0.82,
        },
        viewerCellId: 'c-0-0',
        viewerCombatantId: 'wiz',
      },
    })
    expect(f.povLine).toContain('DM overview')
    expect(f.magicalDarknessLine).toBeNull()
    expect(f.visibilityHint).toBeNull()
  })

  it('turn-style label change follows presentation viewer display label', () => {
    const a = deriveEncounterPerceptionUiFeedback({
      simulatorViewerMode: 'active-combatant',
      presentationViewerDisplayLabel: 'Goblin',
      gridPerception: undefined,
    })
    const b = deriveEncounterPerceptionUiFeedback({
      simulatorViewerMode: 'active-combatant',
      presentationViewerDisplayLabel: 'Wizard',
      gridPerception: undefined,
    })
    expect(a.povLine).toBe('Viewing as: Goblin')
    expect(b.povLine).toBe('Viewing as: Wizard')
  })
})
