import { FormProvider, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppModal } from '@/ui/patterns';
import FormSelectField from '@/ui/patterns/form/FormSelectField';
import type { SelectOption } from '@/ui/patterns/form/FormSelectField';
import type { LocationMapPendingPlacement } from '@/features/content/locations/domain/mapEditor/locationMapEditor.types';

type CityLinkForm = {
  linkedLocationId: string;
};

type LocationMapEditorCityLinkModalProps = {
  open: boolean;
  pending: LocationMapPendingPlacement;
  options: SelectOption[];
  onConfirm: (linkedLocationId: string) => void;
  onCancel: () => void;
};

export function LocationMapEditorCityLinkModal({
  open,
  pending,
  options,
  onConfirm,
  onCancel,
}: LocationMapEditorCityLinkModalProps) {
  const methods = useForm<CityLinkForm>({
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

  const title =
    pending?.type === 'linked-location'
      ? 'Link city to cell'
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
            Choose a campaign city to place on this cell. Only locations allowed by link policy are
            listed.
          </Typography>
          <FormSelectField
            name="linkedLocationId"
            label="City"
            options={options}
            required
            size="small"
          />
        </Stack>
      </FormProvider>
    </AppModal>
  );
}
