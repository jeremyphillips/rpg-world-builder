import { FormProvider, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppModal } from '@/ui/patterns';
import FormSelectField from '@/ui/patterns/form/FormSelectField';
import type { SelectOption } from '@/ui/patterns/form/FormSelectField';
import type { LocationMapPendingPlacement } from '@/features/content/locations/domain/mapEditor';
import type { LocationScaleId } from '@/shared/domain/locations';

function linkedTargetNoun(scale: LocationScaleId): string {
  switch (scale) {
    case 'city':
      return 'city';
    case 'building':
      return 'building';
    case 'site':
      return 'site';
    default:
      return 'location';
  }
}

function linkedTargetLabel(scale: LocationScaleId): string {
  switch (scale) {
    case 'city':
      return 'City';
    case 'building':
      return 'Building';
    case 'site':
      return 'Site';
    default:
      return 'Location';
  }
}

type LinkedLocationPickForm = {
  linkedLocationId: string;
};

export type LocationMapEditorLinkedLocationModalProps = {
  open: boolean;
  pending: LocationMapPendingPlacement;
  options: SelectOption[];
  onConfirm: (linkedLocationId: string) => void;
  onCancel: () => void;
};

export function LocationMapEditorLinkedLocationModal({
  open,
  pending,
  options,
  onConfirm,
  onCancel,
}: LocationMapEditorLinkedLocationModalProps) {
  const methods = useForm<LinkedLocationPickForm>({
    defaultValues: { linkedLocationId: '' },
  });

  const handleClose = () => {
    methods.reset({ linkedLocationId: '' });
    onCancel();
  };

  const submit = methods.handleSubmit((data) => {
    if (!data.linkedLocationId?.trim()) return;
    onConfirm(data.linkedLocationId.trim());
    methods.reset({ linkedLocationId: '' });
  });

  const linkedScale: LocationScaleId | undefined =
    pending?.type === 'linked-location' ? pending.linkedScale : undefined;
  const title =
    pending?.type === 'linked-location' && linkedScale
      ? `Link ${linkedTargetNoun(linkedScale)} to cell`
      : 'Link location';

  return (
    <AppModal
      open={Boolean(open && pending != null)}
      onClose={handleClose}
      headline={title}
      size="standard"
      actions={
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submit()}>
            Place
          </Button>
        </Stack>
      }
    >
      <FormProvider {...methods}>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {linkedScale ? (
              <>
                Choose a campaign {linkedTargetNoun(linkedScale)} to place on this cell. Only
                locations allowed by link policy are listed.
              </>
            ) : (
              <>
                Choose a campaign location to place on this cell. Only locations allowed by link
                policy are listed.
              </>
            )}
          </Typography>
          <FormSelectField
            name="linkedLocationId"
            label={linkedScale ? linkedTargetLabel(linkedScale) : 'Location'}
            options={options}
            required
            size="small"
          />
        </Stack>
      </FormProvider>
    </AppModal>
  );
}
