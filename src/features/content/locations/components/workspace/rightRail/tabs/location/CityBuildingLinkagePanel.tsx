import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import type { Location } from '@/features/content/locations/domain/model/location';
import type { BuildingCityLinkStatus } from '@/shared/domain/locations';
import { AppAlert } from '@/ui/primitives';

export type CityBuildingLinkageRow = {
  building: Location;
  status: BuildingCityLinkStatus;
};

export type CityBuildingLinkagePanelProps = {
  loading: boolean;
  rows: CityBuildingLinkageRow[];
  warningSummaries: string[];
  hasAnyBuildingChild: boolean;
};

/**
 * City location edit — Location tab: lightweight linkage health for buildings parented to this city.
 */
export function CityBuildingLinkagePanel({
  loading,
  rows,
  warningSummaries,
  hasAnyBuildingChild,
}: CityBuildingLinkagePanelProps) {
  if (!hasAnyBuildingChild) return null;

  return (
    <Stack spacing={1.5} sx={{ pb: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Checking building links…
          </Typography>
        </Box>
      ) : null}

      {!loading && warningSummaries.length > 0 ? (
        <AppAlert tone="warning">
          {warningSummaries.map((s, i) => (
            <Typography key={i} variant="body2" component="p" sx={{ mb: i < warningSummaries.length - 1 ? 1 : 0 }}>
              {s}
            </Typography>
          ))}
        </AppAlert>
      ) : null}

      <Typography variant="subtitle2" fontWeight={600}>
        Buildings parented here
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Buildings that list this city as their parent. Use the map to place markers and link buildings.
      </Typography>

      <Stack spacing={1} component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {rows.map(({ building, status }) => (
          <Box
            component="li"
            key={building.id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              px: 1.25,
              py: 1,
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {building.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {status.label}
            </Typography>
            {status.message ? (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {status.message}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
