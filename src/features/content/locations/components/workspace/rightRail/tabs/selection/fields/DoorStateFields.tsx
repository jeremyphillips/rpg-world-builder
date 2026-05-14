import type { AuthoredDoorLockState, AuthoredDoorOpenState } from '@/shared/domain/locations';
import { sanitizeAuthoredDoorState, type ResolvedAuthoredDoorState } from '@/shared/domain/locations';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppSelect } from '@/ui/primitives';

const OPEN_OPTIONS: AuthoredDoorOpenState[] = ['closed', 'open'];
const LOCK_OPTIONS: AuthoredDoorLockState[] = ['unlocked', 'locked', 'barred'];

export type DoorStateFieldsProps = {
  doorState: ResolvedAuthoredDoorState;
  /** Emits sanitized authoring state (invalid combos coerced). */
  onChange: (next: ResolvedAuthoredDoorState) => void;
  /** Edge-run: door state applies to the anchor segment only. */
  anchorScopeCaption?: boolean;
};

export function DoorStateFields({ doorState, onChange, anchorScopeCaption }: DoorStateFieldsProps) {
  const handleOpenChange = (nextOpen: AuthoredDoorOpenState) => {
    let lockState = doorState.lockState;
    if (nextOpen === 'open' && lockState === 'barred') {
      lockState = 'unlocked';
    }
    onChange(sanitizeAuthoredDoorState({ ...doorState, openState: nextOpen, lockState }));
  };

  const handleLockChange = (nextLock: AuthoredDoorLockState) => {
    let openState = doorState.openState;
    if (nextLock === 'barred' && openState === 'open') {
      openState = 'closed';
    }
    onChange(sanitizeAuthoredDoorState({ ...doorState, openState, lockState: nextLock }));
  };

  const openDisabled = doorState.lockState === 'barred';
  const barredDisabled = doorState.openState === 'open';

  return (
    <Stack spacing={1.5}>
      {anchorScopeCaption ? (
        <Typography variant="caption" color="text.secondary">
          Door state applies to this segment only (anchor), not the whole run.
        </Typography>
      ) : null}
      <AppSelect
        label="Open state"
        value={doorState.openState}
        onChange={(v) => handleOpenChange(v as AuthoredDoorOpenState)}
        options={OPEN_OPTIONS.map((v) => ({
          value: v,
          label: v === 'closed' ? 'Closed' : 'Open',
          disabled: v === 'open' && openDisabled,
        }))}
        size="small"
      />
      <AppSelect
        label="Lock state"
        value={doorState.lockState}
        onChange={(v) => handleLockChange(v as AuthoredDoorLockState)}
        options={LOCK_OPTIONS.map((v) => ({
          value: v,
          label:
            v === 'unlocked' ? 'Unlocked' : v === 'locked' ? 'Locked' : 'Barred',
          disabled: v === 'barred' && barredDisabled,
        }))}
        size="small"
      />
    </Stack>
  );
}
