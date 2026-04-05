import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';

import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';
import FormSelectField from '@/ui/patterns/form/FormSelectField';

type ActiveRegionFieldValues = {
  activeRegionId: string;
};

type RegionPaintActiveRegionSelectProps = {
  activeRegionId: string | null;
  regionEntries: readonly LocationMapRegionAuthoringEntry[];
  onSelectActiveRegion: (regionId: string) => void;
};

/**
 * Choose which authored region is the paint target (`activeRegionId`). Used in the Map rail for Region paint.
 */
export function RegionPaintActiveRegionSelect({
  activeRegionId,
  regionEntries,
  onSelectActiveRegion,
}: RegionPaintActiveRegionSelectProps) {
  const methods = useForm<ActiveRegionFieldValues>({
    defaultValues: { activeRegionId: activeRegionId ?? '' },
    mode: 'onBlur',
  });
  const { reset } = methods;

  useEffect(() => {
    reset({ activeRegionId: activeRegionId ?? '' });
  }, [activeRegionId, reset]);

  const options = useMemo(
    () => regionEntries.map((r) => ({ value: r.id, label: r.name })),
    [regionEntries],
  );

  return (
    <FormProvider {...methods}>
      <Box sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}>
        <FormSelectField
          name="activeRegionId"
          label="Choose region"
          placeholder="Select…"
          options={options}
          size="small"
          onAfterChange={(v) => onSelectActiveRegion(v)}
        />
      </Box>
    </FormProvider>
  );
}
