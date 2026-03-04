import { useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCharacterBuilder } from '@/features/characterBuilder/context';
import { ABILITY_KEYS, type AbilityKey } from '@/features/mechanics/domain/core/character';

function formatAbilityLabel(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

const AbilityScoresStep = () => {
  const {
    state,
    rollAbilityScores,
    setAbilityScore,
  } = useCharacterBuilder();

  const { abilityScores, abilityScoreSource, abilityScoresStatus } = state;
  const isRolled = abilityScoreSource === 'generated_roll';

  useEffect(() => {
    if (isRolled && abilityScoresStatus !== 'complete') {
      rollAbilityScores();
    }
  }, [isRolled, abilityScoresStatus, rollAbilityScores]);

  const handleChange = (abilityKey: AbilityKey, raw: string) => {
    const parsed = parseInt(raw, 10);
    setAbilityScore(abilityKey, Number.isNaN(parsed) ? null : Math.max(1, parsed));
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>{state.step.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {isRolled
          ? 'These scores were rolled for your character.'
          : 'Enter your character\u2019s ability scores to continue.'}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, maxWidth: 360 }}>
        {ABILITY_KEYS.map(id => (
          <TextField
            key={id}
            label={formatAbilityLabel(id)}
            type="number"
            size="small"
            slotProps={{ htmlInput: { min: 1 } }}
            value={abilityScores[id] ?? ''}
            onChange={e => handleChange(id, e.target.value)}
            disabled={isRolled}
          />
        ))}
      </Box>

      {abilityScoresStatus !== 'complete' && !isRolled && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1.5 }}>
          All six ability scores are required to continue.
        </Typography>
      )}
    </>
  );
};

export default AbilityScoresStep;
