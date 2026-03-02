import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { ButtonGroup } from '@/ui/patterns'

const LEVEL_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1)

const LevelStep = () => {
  const { state, setTotalLevels } = useCharacterBuilder()
  const { 
    step,
    classes: selectedClasses,
    totalLevel: selectedTotalLevel
  } = state

  // const totalAllocatedLevels = selectedClasses.reduce(
  //   (sum, c) => sum + c.level,
  //   0
  // )

  const isMulticlassing = selectedClasses.length > 1

  if (isMulticlassing) {
    return (
      <h2>You are level {selectedTotalLevel}</h2>
    )
  } else {
    return (
      <>
        <h2>Choose {step.name}</h2>
        <ButtonGroup
          options={LEVEL_OPTIONS.map(level => ({
            id: String(level),
            label: `Level ${level}`
          }))}
          value={selectedTotalLevel}
          onChange={v => setTotalLevels(Number(v))}
        />
      </>
    )
  }
}

export default LevelStep
