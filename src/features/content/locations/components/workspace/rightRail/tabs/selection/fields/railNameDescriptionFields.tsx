import Stack from '@mui/material/Stack';
import { AppFormTextField } from '@/ui/patterns/form';
import { AppTextField } from '@/ui/primitives';

/** Controlled name + description for Selection rail (e.g. path inspector). */
export type RailNameDescriptionFieldsProps = {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  nameLabel?: string;
  descriptionLabel?: string;
};

export function RailNameDescriptionFields({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  nameLabel = 'Name',
  descriptionLabel = 'Description',
}: RailNameDescriptionFieldsProps) {
  return (
    <Stack spacing={2}>
      <AppTextField
        label={nameLabel}
        size="small"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        fullWidth
      />
      <AppTextField
        label={descriptionLabel}
        size="small"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        multiline
        rows={3}
        fullWidth
      />
    </Stack>
  );
}

/**
 * RHF-backed name + description using {@link AppFormTextField}.
 * Must render under `FormProvider` (e.g. region metadata form).
 */
export type RailNameDescriptionFormFieldsProps = {
  nameFieldName?: string;
  descriptionFieldName?: string;
  nameLabel?: string;
  descriptionLabel?: string;
  nameRequired?: boolean;
  onNameAfterChange?: (raw: string) => void;
};

export function RailNameDescriptionFormFields({
  nameFieldName = 'name',
  descriptionFieldName = 'description',
  nameLabel = 'Name',
  descriptionLabel = 'Description',
  nameRequired = false,
  onNameAfterChange,
}: RailNameDescriptionFormFieldsProps) {
  return (
    <Stack spacing={2}>
      <AppFormTextField
        name={nameFieldName}
        label={nameLabel}
        required={nameRequired}
        size="small"
        onAfterChange={onNameAfterChange}
      />
      <AppFormTextField name={descriptionFieldName} label={descriptionLabel} multiline rows={3} size="small" />
    </Stack>
  );
}
