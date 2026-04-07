import { Fragment, useState, type MouseEvent } from 'react';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { getMapSwatchColor } from '@/app/theme/mapColors';
import type {
  LocationMapPaintState,
  MapPaintPaletteFamilyRow,
  MapPaintPaletteItem,
  MapPaintPaletteSection,
} from '@/features/content/locations/domain/authoring/editor';
import type { LocationCellFillFamilyId } from '@/features/content/locations/domain/model/map/locationCellFill.types';
import {
  LocationMapEditorTrayScrollColumn,
  LocationMapEditorTraySectionHeading,
  LocationMapEditorTrayVariantPopover,
} from '@/features/content/locations/components/workspace/leftTools/tray';

type LocationMapEditorPaintTrayProps = {
  sections: MapPaintPaletteSection[];
  activePaint: LocationMapPaintState;
  onPaintChange: (next: LocationMapPaintState) => void;
};

function isFamilySelected(
  row: MapPaintPaletteFamilyRow,
  selected: LocationMapPaintState['selectedSurfaceFill'],
): boolean {
  if (selected == null) return false;
  return selected.familyId === row.familyId;
}

function activeVariantLabel(
  row: MapPaintPaletteFamilyRow,
  selected: LocationMapPaintState['selectedSurfaceFill'],
): string | undefined {
  if (selected == null || selected.familyId !== row.familyId) return undefined;
  return row.variants.find(
    (v) => v.familyId === selected.familyId && v.variantId === selected.variantId,
  )?.label;
}

export function LocationMapEditorPaintTray({
  sections,
  activePaint,
  onPaintChange,
}: LocationMapEditorPaintTrayProps) {
  const [variantPicker, setVariantPicker] = useState<{
    anchor: HTMLElement;
    row: MapPaintPaletteFamilyRow;
  } | null>(null);

  if (sections.length === 0) return null;

  const domain = activePaint.domain;
  const closePicker = () => setVariantPicker(null);
  const surfaceSel = activePaint.selectedSurfaceFill;

  const handleDomainChange = (_: MouseEvent<HTMLElement>, value: 'surface' | 'region' | null) => {
    if (value == null) return;
    if (value === 'surface') {
      onPaintChange({ ...activePaint, domain: 'surface' });
      return;
    }
    onPaintChange({ ...activePaint, domain: 'region' });
  };

  const handleSelectSurface = (familyId: LocationCellFillFamilyId, variantId: string) => {
    onPaintChange({
      ...activePaint,
      domain: 'surface',
      selectedSurfaceFill: { familyId, variantId },
    });
  };

  return (
    <LocationMapEditorTrayScrollColumn alignItems="stretch" gap={1}>
      <ToggleButtonGroup
        exclusive
        value={domain}
        onChange={handleDomainChange}
        orientation="vertical"
        size="small"
        sx={{
          alignSelf: 'stretch',
          borderRadius: 0,
          '& .MuiToggleButton-root': { borderRadius: 0 },
        }}
      >
        <ToggleButton value="surface" aria-label="Surface paint">
          Surface
        </ToggleButton>
        <ToggleButton value="region" aria-label="Region paint">
          Region
        </ToggleButton>
      </ToggleButtonGroup>

      {domain === 'surface' ? (
        <Stack direction="column" spacing={0.75} alignItems="center">
          {sections.map((section, sectionIndex) => (
            <Fragment key={section.sectionId}>
              <LocationMapEditorTraySectionHeading label={section.label} padTop={sectionIndex > 0} />
              {section.families.map((row) => {
                const selected = isFamilySelected(row, surfaceSel);
                const showVariantPicker = row.variants.length > 1;
                const defaultFill = row.variants.find((v) => v.variantId === row.defaultVariantId)!;
                const defaultColor = getMapSwatchColor(defaultFill.swatchColorKey);
                const activeLabel = activeVariantLabel(row, surfaceSel);
                const showVariantSubtitle =
                  selected &&
                  surfaceSel != null &&
                  surfaceSel.variantId !== row.defaultVariantId;

                const onPrimaryClick = () => {
                  handleSelectSurface(row.familyId, row.defaultVariantId);
                };

                const onOpenVariantPicker = (e: MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setVariantPicker({ anchor: e.currentTarget, row });
                };

                const tooltipTitle = defaultFill.description
                  ? `${defaultFill.label} — ${defaultFill.description}`
                  : defaultFill.label;

                return (
                  <Fragment key={`${section.sectionId}:${row.familyId}`}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.25,
                        alignSelf: 'center',
                        maxWidth: 48,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={selected ? 700 : 500}
                        sx={{ lineHeight: 1, fontSize: 9, textAlign: 'center', px: 0.25 }}
                      >
                        {row.label.length <= 10 ? row.label : `${row.label.slice(0, 8)}…`}
                      </Typography>
                      <Tooltip title={tooltipTitle} placement="right">
                        <Box
                          sx={{
                            position: 'relative',
                            width: 40,
                            alignSelf: 'center',
                          }}
                        >
                          <Badge
                            badgeContent={showVariantPicker ? row.variants.length : 0}
                            color="default"
                            invisible={!showVariantPicker}
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: 9,
                                minWidth: 16,
                                height: 16,
                                right: 2,
                                top: 2,
                              },
                            }}
                          >
                            <Box
                              component="button"
                              type="button"
                              onClick={onPrimaryClick}
                              sx={{
                                width: 40,
                                minHeight: 28,
                                px: 0,
                                py: 0,
                                borderRadius: 0.5,
                                border: 2,
                                borderColor: selected ? 'primary.main' : 'divider',
                                bgcolor: defaultColor,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: selected ? 2 : 0,
                              }}
                              aria-label={row.label}
                              aria-pressed={selected}
                            />
                          </Badge>
                          {showVariantPicker ? (
                            <IconButton
                              type="button"
                              size="small"
                              onClick={onOpenVariantPicker}
                              aria-label={`More variants for ${row.label}`}
                              sx={{
                                position: 'absolute',
                                right: -6,
                                bottom: -4,
                                width: 22,
                                height: 22,
                                p: 0.25,
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                              }}
                            >
                              <UnfoldMoreIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          ) : null}
                        </Box>
                      </Tooltip>
                      {showVariantSubtitle && activeLabel ? (
                        <Typography
                          variant="caption"
                          sx={{
                            lineHeight: 1,
                            fontSize: 7,
                            textAlign: 'center',
                            color: 'primary.main',
                            px: 0.25,
                          }}
                        >
                          {activeLabel.length <= 12 ? activeLabel : `${activeLabel.slice(0, 10)}…`}
                        </Typography>
                      ) : null}
                    </Box>
                  </Fragment>
                );
              })}
            </Fragment>
          ))}
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.25 }}>
          Use the Map panel for region tools.
        </Typography>
      )}

      {variantPicker ? (
        <LocationMapEditorTrayVariantPopover
          open
          anchorEl={variantPicker.anchor}
          onClose={closePicker}
        >
          <List dense disablePadding>
            {variantPicker.row.variants.map((item: MapPaintPaletteItem) => {
              const color = getMapSwatchColor(item.swatchColorKey);
              const isSel =
                surfaceSel != null &&
                surfaceSel.familyId === item.familyId &&
                surfaceSel.variantId === item.variantId;
              return (
                <Tooltip
                  key={`${item.familyId}:${item.variantId}`}
                  title={item.description ?? item.label}
                  placement="right"
                >
                  <ListItemButton
                    onClick={() => {
                      handleSelectSurface(item.familyId, item.variantId);
                      closePicker();
                    }}
                    selected={isSel}
                    sx={{ gap: 1 }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        flexShrink: 0,
                        borderRadius: 0.25,
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: color,
                      }}
                      aria-hidden
                    />
                    <Box>
                      <Typography variant="body2">{item.label}</Typography>
                      {item.description ? (
                        <Typography variant="caption" color="text.secondary">
                          {item.description}
                        </Typography>
                      ) : null}
                    </Box>
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        </LocationMapEditorTrayVariantPopover>
      ) : null}
    </LocationMapEditorTrayScrollColumn>
  );
}
