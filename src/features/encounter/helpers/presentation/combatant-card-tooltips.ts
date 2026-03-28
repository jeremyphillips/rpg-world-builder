import { getEffectConditionRulesTextForKey } from '@/features/mechanics/domain/conditions/effect-condition-definitions'

/** Glossary strings for core stat badges on the active combatant card. */
export const COMBATANT_CORE_STAT_TOOLTIP_BY_LABEL: Record<string, string> = {
  AC: 'Armor Class: how hard you are to hit. Attacks compare against AC unless they use a saving throw instead.',
  HP: 'Hit points: current total out of maximum. At 0 you fall unconscious (or die if damage exceeds max HP).',
  Init: 'Initiative modifier: added to your initiative roll to determine turn order.',
  Move: 'Walking speed in feet (one round). Other movement modes may appear on the stat block.',
}

export const TRACKED_PARTS_BADGE_TOOLTIP =
  'Tracks a multi-part creature resource (e.g. heads or limbs). Some abilities destroy parts before the body falls.'

export const CONCENTRATING_BADGE_TOOLTIP =
  'Concentrating on a spell. Taking damage may require a Constitution saving throw to maintain concentration.'

function normalizeMarkerKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '_')
}

/** Tooltip for AC / HP / Init / Move / Heads / Limbs preview & active stat badges. */
export function getPreviewStatTooltip(label: string): string | undefined {
  if (label === 'Heads' || label === 'Limbs') return TRACKED_PARTS_BADGE_TOOLTIP
  return COMBATANT_CORE_STAT_TOOLTIP_BY_LABEL[label]
}

/** SRD-style blurb when the marker label maps to an `EffectConditionId` (e.g. poisoned, charmed). */
export function tooltipForConditionMarkerLabel(label: string): string | undefined {
  return getEffectConditionRulesTextForKey(normalizeMarkerKey(label))
}
