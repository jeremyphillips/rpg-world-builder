import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { getSystemArmor } from '@/features/mechanics/domain/rulesets/system/armor'
import { getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters'
import { formatMonsterArmorClassBreakdown } from '../utils/formatters'
import { MONSTER_DETAIL_SPECS } from './details/monsterDetail.spec'
import { buildMonsterCustomColumns } from './list/monsterList.columns'
import { calculateMonsterArmorClass } from './mechanics/calculateMonsterArmorClass'

function buildArmorById() {
  return Object.fromEntries(
    getSystemArmor(DEFAULT_SYSTEM_RULESET_ID).map((armor) => [armor.id, armor]),
  )
}

describe('monster armor class display', () => {
  const armorById = buildArmorById()
  const goblin = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'goblin-warrior')
  const goblinArmorClass = calculateMonsterArmorClass(goblin!, armorById)

  it('renders the calculated armor class in the list column', () => {
    expect(goblin).toBeDefined()
    const armorColumn = buildMonsterCustomColumns(armorById).find(
      (column) => column.field === 'armorClass',
    )

    render(<span>{String(armorColumn?.accessor?.(goblin!))}</span>)

    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('formats the armor class breakdown string', () => {
    expect(formatMonsterArmorClassBreakdown(goblinArmorClass)).toBe(
      'AC 15 (Leather 11 + Shield 2 + DEX 2)',
    )
    expect(
      formatMonsterArmorClassBreakdown(goblinArmorClass, { includePrefix: false }),
    ).toBe('15 (Leather 11 + Shield 2 + DEX 2)')
  })

  it('renders the formatted armor class in the detail spec', () => {
    expect(goblin).toBeDefined()
    const armorSpec = MONSTER_DETAIL_SPECS.find((spec) => spec.key === 'armorClass')

    render(<span>{armorSpec?.render(goblin!, { armorById })}</span>)

    expect(
      screen.getByText('15 (Leather 11 + Shield 2 + DEX 2)'),
    ).toBeInTheDocument()
  })

  it('shows the formatted armor class in a tooltip on hover', async () => {
    expect(goblin).toBeDefined()
    const armorColumn = buildMonsterCustomColumns(armorById).find(
      (column) => column.field === 'armorClass',
    )

    render(
      <div>
        {armorColumn?.renderCell?.({ row: goblin!, value: goblinArmorClass.value } as any)}
      </div>,
    )

    fireEvent.mouseOver(screen.getByText('15'))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'AC 15 (Leather 11 + Shield 2 + DEX 2)',
    )
  })
})
