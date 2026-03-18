import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { InvalidationNotice } from '@/features/characterBuilder/components'
import { ButtonGroup } from '@/ui/patterns'
import { getAlignmentOptionsForClass } from '@/features/mechanics/domain/character/selection'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { resolveAlignmentOptions } from '@/features/mechanics/domain/rulesets/alignment/resolveOptions'

const AlignmentStep = () => {
  const { state, setAlignment, stepNotices, dismissNotice } = useCharacterBuilder()
  const {
    alignment: selectedAlignment,
    classes: selectedClasses,
    step
  } = state

  const { ruleset, catalog } = useCampaignRules()
  const { classesById } = catalog
  const { alignment: alignmentRules } = ruleset.mechanics.character
  const alignmentOptions = resolveAlignmentOptions(alignmentRules.optionSetId)
  const classIds = selectedClasses.map((c) => c.classId).filter(Boolean) as string[]
  const allowedAlignmentOptions = getAlignmentOptionsForClass(classIds, alignmentOptions, classesById)

  const notices = stepNotices.get('alignment') ?? []

  return (
    <>
      <h2>Choose {step.name}</h2>
      <InvalidationNotice items={notices} onDismiss={() => dismissNotice('alignment')} />
      <ButtonGroup
        options={allowedAlignmentOptions}
        value={selectedAlignment}
        onChange={setAlignment}
      />
    </>
  )
}

export default AlignmentStep
