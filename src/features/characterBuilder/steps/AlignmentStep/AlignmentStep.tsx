import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { InvalidationNotice } from '@/features/characterBuilder/components'
import { ButtonGroup } from '@/ui/patterns'
import { getAlignmentOptionsForCharacter } from '@/features/character/domain/reference'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'

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

  const classIds = selectedClasses.map((c) => c.classId).filter(Boolean) as string[]

  const allowedAlignmentOptions = getAlignmentOptionsForCharacter(classIds, alignmentRules.options, classesById)

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
