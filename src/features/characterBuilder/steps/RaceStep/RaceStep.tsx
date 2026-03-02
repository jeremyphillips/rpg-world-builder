import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { InvalidationNotice } from '@/features/characterBuilder/components'
import { ButtonGroup } from '@/ui/patterns'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'

const RaceStep = () => {
  const { state, setRace, stepNotices, dismissNotice } = useCharacterBuilder()
  const { step, race: selectedRace } = state

  const { catalog } = useCampaignRules()
  const { racesById } = catalog

  const notices = stepNotices.get('race') ?? []

  return (
    <>
      <h2>Choose {step.name}</h2>
      <InvalidationNotice items={notices} onDismiss={() => dismissNotice('race')} />
      <ButtonGroup
        options={Object.values(racesById).map(race => ({
          id: race.id,
          label: race.name
        }))}
        value={selectedRace}
        onChange={setRace}
      />
    </>
  )
}

export default RaceStep
