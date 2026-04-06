import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { PresentationMetadataRow } from './placedObjectRail.helpers';

/** Key/value rows from registry `variant.presentation` (see {@link presentationRowsFromPresentation}). */
export function PlacedObjectPresentationMetadataRows({ rows }: { rows: readonly PresentationMetadataRow[] }) {
  if (rows.length === 0) return null;
  return (
    <Stack spacing={0.5}>
      {rows.map((r, i) => (
        <Typography key={`${r.label}-${i}`} variant="body2" color="text.secondary">
          <Box component="span" sx={{ fontWeight: 600 }}>
            {r.label}:
          </Box>{' '}
          {r.value}
        </Typography>
      ))}
    </Stack>
  );
}

/** Shared top block: category → title → placement — used by placed-object template and empty-cell inspector. */
export function SelectionRailIdentityBlock({
  categoryLabel,
  title,
  placementLine,
  secondaryCaption,
}: {
  categoryLabel: string;
  title: string;
  placementLine: string;
  /** Host map / floor context (optional) */
  secondaryCaption?: string;
}) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
        {categoryLabel}
      </Typography>
      <Typography variant="h6" component="h3" sx={{ mt: 0.25, fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {placementLine}
      </Typography>
      {secondaryCaption ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {secondaryCaption}
        </Typography>
      ) : null}
    </Box>
  );
}

export type PlacedObjectRailTemplateProps = {
  /** e.g. Furniture, Structure — registry / product grouping */
  categoryLabel: string;
  /** Primary type identity — Table, Door, Building, … */
  objectTitle: string;
  /** Where the object sits on the map — cell coords, edge id, … */
  placementLine: string;
  /** Curated metadata (key/value rows, family-specific forms) — between placement and label */
  metadata?: ReactNode;
  /**
   * When set, linked entity title/name is the display identity; freeform label field is omitted.
   * Phase 4: applies to registry families with `linkedScale` matching the linked location.
   */
  linkedDisplayName?: string;
  /** Freeform placard label — only when `linkedDisplayName` is not set */
  labelField?: ReactNode;
  /** Link building, stairs pairing, future door config — above Remove */
  actionsSlot?: ReactNode;
  onRemoveFromMap?: () => void;
};

/**
 * Shared selection-rail backbone for **all** placed authored objects (cell + edge).
 * See Phase 4 plan: category → object → placement → metadata → label / linked name → actions → remove.
 */
export function PlacedObjectRailTemplate({
  categoryLabel,
  objectTitle,
  placementLine,
  metadata,
  linkedDisplayName,
  labelField,
  actionsSlot,
  onRemoveFromMap,
}: PlacedObjectRailTemplateProps) {
  return (
    <Stack spacing={2}>
      <SelectionRailIdentityBlock
        categoryLabel={categoryLabel}
        title={objectTitle}
        placementLine={placementLine}
      />

      {metadata ? <Box>{metadata}</Box> : null}

      {linkedDisplayName ? (
        <Typography variant="body1" fontWeight={500}>
          {linkedDisplayName}
        </Typography>
      ) : (
        labelField
      )}

      {actionsSlot ? <Box>{actionsSlot}</Box> : null}

      {onRemoveFromMap ? (
        <>
          <Divider />
          <Button size="small" color="error" variant="outlined" onClick={onRemoveFromMap}>
            Remove from map
          </Button>
        </>
      ) : null}
    </Stack>
  );
}
