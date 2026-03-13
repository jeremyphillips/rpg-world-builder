import type { Monster } from "@/features/content/monsters/domain/types"
import { convert2eToCore } from "./2e"
import type { EditionRule } from "../../edition"
import { convert1eToCore } from "./1e"
import { convertCoreTo5e } from "./5e"
import { convertClassicDnDToCore } from "./classic"
import { convertOddToCore } from "./odd"
import { convertD20ToCore } from "./d20"
import { convert4eToCore } from "./4e"

/**
 * Convert a monster's edition rule to a target edition.
 * Supports 1e → 5e, 2e → 5e, Holmes → 5e, BECMI → 5e, and B/X → 5e via the core mechanical model.
 * Returns `null` if conversion is not possible.
 */
export function convertEditionRule(
  monster: Monster,
  sourceRule: EditionRule,
  targetEdition: string
): EditionRule | null {
  if (sourceRule.edition === '1e' && targetEdition === '5e') {
    const core = convert1eToCore(sourceRule, monster)
    return convertCoreTo5e(core, sourceRule)
  }

  if (sourceRule.edition === '2e' && targetEdition === '5e') {
    const core = convert2eToCore(sourceRule, monster)
    return convertCoreTo5e(core, sourceRule)
  }

  if (sourceRule.edition === 'becmi' && targetEdition === '5e') {
    const core = convertClassicDnDToCore(sourceRule, monster)
    return convertCoreTo5e(core, sourceRule)
  }

  if (sourceRule.edition === 'bx' && targetEdition === '5e') {
    const core = convertClassicDnDToCore(sourceRule, monster)
    return convertCoreTo5e(core, sourceRule)
  }

  if (sourceRule.edition === 'b' && targetEdition === '5e') {
    const core = convert1eToCore(sourceRule, monster)
    return convertCoreTo5e(core, sourceRule)
  }

  if (sourceRule.edition === 'odd' && targetEdition === '5e') {
    const core = convertOddToCore(sourceRule, monster)
    return convertCoreTo5e(core, sourceRule)
  }

  if (sourceRule.edition === '3e' && targetEdition === '5e') {
    const core = convertD20ToCore(sourceRule, monster)
    return convertCoreTo5e(core, sourceRule)
  }

  if (sourceRule.edition === '3.5e' && targetEdition === '5e') {
    const core = convertD20ToCore(sourceRule, monster)
    return convertCoreTo5e(core, sourceRule)
  }

  if (sourceRule.edition === '4e' && targetEdition === '5e') {
    const core = convert4eToCore(sourceRule, monster)
    return convertCoreTo5e(core, sourceRule)
  }

  return null
}