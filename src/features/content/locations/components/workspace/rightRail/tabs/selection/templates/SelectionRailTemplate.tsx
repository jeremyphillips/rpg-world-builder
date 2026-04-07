import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { PresentationMetadataRow } from '../selectionRail.helpers';

/** Key/value rows from registry `variant.presentation` (see {@link presentationRowsFromPresentation}). */
export function SelectionMetadataRows({ rows }: { rows: readonly PresentationMetadataRow[] }) {
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

/** Shared top block: category → title → placement — used by selection template and empty-cell inspector. */
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

export type SelectionRailTemplateProps = {
  /** e.g. Furniture, Structure — registry / product grouping */
  categoryLabel: string;
  /** Primary type identity — Table, Door, Path, … */
  title: string;
  /** Where the entity sits on the map — cell coords, edge id, chain summary, … */
  placementLine?: string;
  /** Registry rows, chips, stair blocks — between identity and children */
  metadata?: ReactNode;
  /** Linked name, label field, config — below metadata, above actions/remove */
  children?: ReactNode;
  /** Link building, stairs pairing, etc. — above remove */
  actionsSlot?: ReactNode;
  onRemoveFromMap?: () => void;
};

/**
 * Shared selection-rail shell: identity → metadata → children (specialty) → actions → remove.
 */
export function SelectionRailTemplate({
  categoryLabel,
  title,
  placementLine = '',
  metadata,
  children,
  actionsSlot,
  onRemoveFromMap,
}: SelectionRailTemplateProps) {
  return (
    <Stack spacing={2}>
      <SelectionRailIdentityBlock
        categoryLabel={categoryLabel}
        title={title}
        placementLine={placementLine}
      />

      {metadata ? <Box>{metadata}</Box> : null}

      {children ? <Box>{children}</Box> : null}

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
