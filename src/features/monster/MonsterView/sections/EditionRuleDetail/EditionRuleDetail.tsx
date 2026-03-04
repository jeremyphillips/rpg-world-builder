import { MONSTER_LABELS, type EditionRule } from '@/data/monsters'
import { StatRow } from '../../components'
import { formatHitDice } from '../../../utils'
import { formatNumberAppearing, formatMovement, formatAttacks, formatMorale } from '../../../utils'

import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

interface EditionRuleDetailProps {
  editionRule: EditionRule
  // labels: typeof MONSTER_LABELS
}

export function EditionRuleDetail({ editionRule }: EditionRuleDetailProps) {
  const hasHitDice = 'hitDice' in editionRule.mechanics
  const hasLevel = 'level' in editionRule.mechanics
  const L = MONSTER_LABELS

  return (
    <>
      {/* Hit Dice / Level+Role & Source */}
      {hasLevel && (
        <>
          <StatRow label={L.level} value={(editionRule.mechanics as any).level} />
          <StatRow label={L.role} value={
            (editionRule.mechanics as any).roleModifier
              ? `${(editionRule.mechanics as any).roleModifier} ${(editionRule.mechanics as any).role}`
              : (editionRule.mechanics as any).role
          } />
          <StatRow label={L.hitPoints} value={(editionRule.mechanics as any).hitPoints} />
        </>
      )}
      {hasHitDice && <StatRow label={L.hitDice} value={formatHitDice(editionRule)} />}

      {editionRule.source?.book && (
        <StatRow label={L.source} value={editionRule.source.book} />
      )}

      <Divider sx={{ my: 3 }} />

      {/* Lore */}
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        Lore
      </Typography>

      <StatRow label={L.alignment} value={editionRule.lore.alignment} />
      <StatRow label={L.xpValue} value={editionRule.lore.xpValue?.toLocaleString()} />
      <StatRow label={L.intelligence} value={editionRule.lore.intelligence} />
      {'frequency' in editionRule.lore && (
        <StatRow label={L.frequency} value={editionRule.lore.frequency} />
      )}
      {'organization' in editionRule.lore && (
        <StatRow label={L.organization} value={editionRule.lore.organization} />
      )}
      {'environment' in editionRule.lore && (
        <StatRow label={L.environment} value={(editionRule.lore as any).environment} />
      )}
      {'origin' in editionRule.lore && (
        <StatRow label={L.origin} value={(editionRule.lore as any).origin} />
      )}
      {'numberAppearing' in editionRule.lore && editionRule.lore.numberAppearing && (
        <StatRow label={L.numberAppearing} value={formatNumberAppearing(editionRule.lore.numberAppearing)} />
      )}
      {'percentInLair' in editionRule.lore && (
        <StatRow label={L.percentInLair} value={`${(editionRule.lore as any).percentInLair}%`} />
      )}
      {'treasureType' in editionRule.lore && (
        <StatRow label={L.treasureType} value={
          typeof editionRule.lore.treasureType === 'object'
            ? Object.entries(editionRule.lore.treasureType as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(', ')
            : editionRule.lore.treasureType
        } />
      )}
      {'challengeRating' in editionRule.lore && (
        <StatRow label={L.challengeRating} value={String(editionRule.lore.challengeRating)} />
      )}

      <Divider sx={{ my: 3 }} />

      {/* Mechanics */}
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        Mechanics
      </Typography>

      <StatRow label={L.armorClass} value={editionRule.mechanics.armorClass} />
      {'fortitude' in editionRule.mechanics && (
        <StatRow label={L.fortitude} value={(editionRule.mechanics as any).fortitude} />
      )}
      {'reflex' in editionRule.mechanics && (
        <StatRow label={L.reflex} value={(editionRule.mechanics as any).reflex} />
      )}
      {'will' in editionRule.mechanics && (
        <StatRow label={L.will} value={(editionRule.mechanics as any).will} />
      )}
      {'initiative' in editionRule.mechanics && (
        <StatRow label={L.initiative} value={`+${(editionRule.mechanics as any).initiative}`} />
      )}
      <StatRow label={L.movement} value={formatMovement(editionRule.mechanics.movement)} />
      {'thac0' in editionRule.mechanics && (
        <StatRow label={L.thac0} value={(editionRule.mechanics as any).thac0} />
      )}
      {'attackBonus' in editionRule.mechanics && (
        <StatRow label={L.attackBonus} value={`+${(editionRule.mechanics as any).attackBonus}`} />
      )}
      {'baseAttackBonus' in editionRule.mechanics && (
        <StatRow label={L.baseAttackBonus} value={`+${(editionRule.mechanics as any).baseAttackBonus}`} />
      )}
      {'proficiencyBonus' in editionRule.mechanics && (editionRule.mechanics as any).proficiencyBonus && (
        <StatRow label={L.proficiencyBonus} value={`+${(editionRule.mechanics as any).proficiencyBonus}`} />
      )}
      <StatRow label={L.attacks} value={formatAttacks(editionRule.mechanics.attacks)} />
      {'specialAttacks' in editionRule.mechanics && (editionRule.mechanics as any).specialAttacks?.length > 0 && (
        <StatRow
          label={L.specialAttacks}
          value={(editionRule.mechanics as any).specialAttacks.join(', ')}
        />
      )}
      {editionRule.mechanics.specialDefenses && editionRule.mechanics.specialDefenses.length > 0 && (
        <StatRow
          label={L.specialDefenses}
          value={editionRule.mechanics.specialDefenses.join(', ')}
        />
      )}
      {'morale' in editionRule.mechanics && (editionRule.mechanics as any).morale != null && (
        <StatRow label={L.morale} value={formatMorale((editionRule.mechanics as any).morale)} />
      )}
      {'saveAs' in editionRule.mechanics && (editionRule.mechanics as any).saveAs && (
        <StatRow
          label={L.saveAs}
          value={`${(editionRule.mechanics as any).saveAs.class}: ${(editionRule.mechanics as any).saveAs.level}`}
        />
      )}
      {'abilities' in editionRule.mechanics && (editionRule.mechanics as any).abilities && (
        <StatRow
          label={L.abilities}
          value={Object.entries((editionRule.mechanics as any).abilities)
            .map(([k, v]) => `${k.toUpperCase()} ${v}`)
            .join(', ')}
        />
      )}
      {'traits' in editionRule.mechanics && (editionRule.mechanics as any).traits?.length > 0 && (
        <StatRow label={L.traits} value={(editionRule.mechanics as any).traits.join(', ')} />
      )}
    </>
  )
}