import { Fragment, useState, type MouseEvent } from 'react';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import Badge from '@mui/material/Badge';
import {
  LocationMapEditorTrayScrollColumn,
  LocationMapEditorTraySectionHeading,
  LocationMapEditorTrayVariantPopover,
} from '@/features/content/locations/components/workspace/leftTools/tray';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  getPlacedObjectPaletteCategoryLabel,
  getPlacedObjectVariantPickerRowsForFamily,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';
import type {
  LocationMapActivePlaceSelection,
  MapPlacePaletteItem,
} from '@/features/content/locations/domain/authoring/editor';

type LocationMapEditorPlaceTrayProps = {
  items: MapPlacePaletteItem[];
  activePlace: LocationMapActivePlaceSelection;
  onSelectPlace: (selection: LocationMapActivePlaceSelection) => void;
};

function isFamilyTileSelected(item: MapPlacePaletteItem, active: LocationMapActivePlaceSelection): boolean {
  if (!active) return false;
  if (item.category === 'linked-content' && active.category !== 'linked-content') return false;
  if (item.category === 'map-object' && active.category !== 'map-object') return false;
  return active.kind === item.kind;
}

function itemKey(item: MapPlacePaletteItem): string {
  return item.category === 'linked-content' ? `linked:${item.kind}` : `object:${item.kind}`;
}

function paletteTooltipTitle(item: MapPlacePaletteItem): string {
  const base = item.description ? `${item.label} — ${item.description}` : item.label;
  if (item.category === 'map-object' && item.variantCount > 1) {
    return `${base}\n\nClick the tile to place the default variant. Use the menu to choose another variant.`;
  }
  return base;
}

/**
 * Left toolbar tray for Place mode — registry-driven items only; sets `activePlace` (no placement mapping).
 */
export function LocationMapEditorPlaceTray({
  items,
  activePlace,
  onSelectPlace,
}: LocationMapEditorPlaceTrayProps) {
  const [variantPicker, setVariantPicker] = useState<{
    anchor: HTMLElement;
    kind: MapPlacePaletteItem & { category: 'map-object' };
  } | null>(null);

  if (items.length === 0) return null;

  const closePicker = () => setVariantPicker(null);

  return (
    <LocationMapEditorTrayScrollColumn>
      {items.map((item, index) => {
        const key = itemKey(item);
        const selected = isFamilyTileSelected(item, activePlace);
        const showSectionHeading =
          index === 0 || item.paletteCategory !== items[index - 1]!.paletteCategory;
        const showMapVariantPicker =
          item.category === 'map-object' && item.variantCount > 1;
        const activeVariantLabel =
          selected && activePlace && activePlace.kind === item.kind
            ? getPlacedObjectVariantPickerRowsForFamily(item.kind).find(
                (r) => r.variantId === activePlace.variantId,
              )?.label
            : undefined;

        const onPrimaryClick = () => {
          if (item.category === 'linked-content') {
            onSelectPlace({
              category: 'linked-content',
              kind: item.kind,
              variantId: item.defaultVariantId,
            });
          } else {
            onSelectPlace({
              category: 'map-object',
              kind: item.kind,
              variantId: item.defaultVariantId,
            });
          }
        };

        const onOpenVariantPicker = (e: MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          e.stopPropagation();
          if (item.category !== 'map-object') return;
          setVariantPicker({ anchor: e.currentTarget, kind: item });
        };

        const tileInner = (
          <>
            <Box
              component="img"
              src={item.previewImageUrl}
              alt=""
              sx={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
              aria-hidden
            />
            <Typography
              variant="caption"
              fontWeight={selected ? 700 : 500}
              sx={{ lineHeight: 1, fontSize: 9, textAlign: 'center', px: 0.25 }}
            >
              {item.label.length <= 10 ? item.label : `${item.label.slice(0, 8)}…`}
            </Typography>
            {selected && activeVariantLabel && activePlace?.variantId !== item.defaultVariantId ? (
              <Typography
                variant="caption"
                sx={{ lineHeight: 1, fontSize: 7, textAlign: 'center', color: 'primary.main', px: 0.25 }}
              >
                {activeVariantLabel.length <= 12 ? activeVariantLabel : `${activeVariantLabel.slice(0, 10)}…`}
              </Typography>
            ) : null}
          </>
        );

        return (
          <Fragment key={key}>
            {showSectionHeading ? (
              <LocationMapEditorTraySectionHeading
                label={getPlacedObjectPaletteCategoryLabel(item.paletteCategory)}
                padTop={index !== 0}
              />
            ) : null}
            <Tooltip
              title={paletteTooltipTitle(item)}
              placement="right"
              slotProps={{ tooltip: { sx: { whiteSpace: 'pre-line' } } }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: 40,
                  alignSelf: 'center',
                }}
              >
                <Badge
                  badgeContent={showMapVariantPicker ? item.variantCount : 0}
                  color="default"
                  invisible={!showMapVariantPicker}
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
                      minHeight: 40,
                      px: 0.25,
                      py: 0.25,
                      borderRadius: 0.5,
                      border: 2,
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: 'action.hover',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.25,
                      boxShadow: selected ? 2 : 0,
                    }}
                    aria-label={item.label}
                    aria-pressed={selected}
                  >
                    {tileInner}
                  </Box>
                </Badge>
                {showMapVariantPicker ? (
                  <IconButton
                    type="button"
                    size="small"
                    onClick={onOpenVariantPicker}
                    aria-label={`More variants for ${item.label}`}
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
          </Fragment>
        );
      })}
      {variantPicker ? (
        <LocationMapEditorTrayVariantPopover
          open
          anchorEl={variantPicker.anchor}
          onClose={closePicker}
        >
          <List dense disablePadding>
            {getPlacedObjectVariantPickerRowsForFamily(variantPicker.kind.kind).map((row) => {
              return (
                <Tooltip key={row.variantId} title={row.description ?? row.label} placement="right">
                  <ListItemButton
                    onClick={() => {
                      onSelectPlace({
                        category: 'map-object',
                        kind: variantPicker.kind.kind,
                        variantId: row.variantId,
                      });
                      closePicker();
                    }}
                    selected={
                      activePlace?.category === 'map-object' &&
                      activePlace.kind === variantPicker.kind.kind &&
                      activePlace.variantId === row.variantId
                    }
                  >
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      <Box
                        component="img"
                        src={row.previewImageUrl}
                        alt=""
                        sx={{ width: 24, height: 24, objectFit: 'contain' }}
                        aria-hidden
                      />
                    </Box>
                    <ListItemText primary={row.label} secondary={row.description} />
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
