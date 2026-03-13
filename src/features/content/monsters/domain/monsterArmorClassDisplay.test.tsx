import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds'
import { getSystemArmor } from '@/features/mechanics/domain/core/rules/systemCatalog.armor'
import { getSystemMonster } from '@/features/mechanics/domain/core/rules/systemCatalog.monsters'
import { MONSTER_DETAIL_SPECS } from './details/monsterDetail.spec'
import { buildMonsterCustomColumns } from './list/monsterList.columns'

function buildArmorById() {
  return Object.fromEntries(
    getSystemArmor(DEFAULT_SYSTEM_RULESET_ID).map((armor) => [armor.id, armor]),
  )
}

describe('monster armor class display', () => {
  const armorById = buildArmorById()
  const goblin = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'goblin-warrior')

  it('renders the calculated armor class in the list column', () => {
    expect(goblin).toBeDefined()
    const armorColumn = buildMonsterCustomColumns(armorById).find(
      (column) => column.field === 'armorClass',
    )

    render(<span>{armorColumn?.accessor?.(goblin!)}</span>)

    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('renders the calculated armor class in the detail spec', () => {
    expect(goblin).toBeDefined()
    const armorSpec = MONSTER_DETAIL_SPECS.find((spec) => spec.key === 'armorClass')

    render(<span>{armorSpec?.render(goblin!, { armorById })}</span>)

    expect(screen.getByText('15')).toBeInTheDocument()
  })
})
