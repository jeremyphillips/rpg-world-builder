import { useCharacterBuilder } from '@/features/characterBuilder/context';
import { ButtonGroup } from '@/ui/patterns';

const SOURCE_OPTIONS = [
  { id: 'import_manual', label: 'Import existing character' },
  { id: 'generated_roll', label: 'Generate new character' },
] as const;

const CharacterSourceStep = () => {
  const { state, chooseImportCharacter, chooseGenerateCharacter } = useCharacterBuilder();

  const handleChange = (value: string) => {
    if (value === 'import_manual') {
      chooseImportCharacter();
    } else {
      chooseGenerateCharacter();
    }
  };

  return (
    <>
      <h2>{state.step.name}</h2>
      <p>How would you like to provide ability scores?</p>
      <ButtonGroup
        options={[...SOURCE_OPTIONS]}
        value={state.abilityScoreSource}
        onChange={handleChange}
        autoSelectSingle={false}
      />
    </>
  );
};

export default CharacterSourceStep;
