import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Single entry row rendered by {@link NamedEntryList}. Mirrors the shape used
 * by monster traits and other "name + (optional callout) + (optional description)"
 * detail summaries.
 */
export type NamedEntry = {
  /** Stable key for React. Falls back to `name + index` when omitted. */
  id?: string;
  /** Title rendered as `subtitle2`. */
  name: ReactNode;
  /** Optional emphasized callout under the title (e.g. action tags). */
  callout?: ReactNode;
  /** Optional descriptive body, rendered as `body2`. */
  description?: ReactNode;
  /** Optional extra ReactNode appended after the description. */
  children?: ReactNode;
};

export type NamedEntryListProps = {
  items: ReadonlyArray<NamedEntry>;
  /** Vertical spacing between rows (MUI spacing units). Defaults to 1.5. */
  spacing?: number;
  /** Rendered when `items` is empty. Defaults to the em-dash placeholder. */
  emptyFallback?: ReactNode;
};

/**
 * Shared list primitive for `name + description` detail summaries.
 *
 * Replaces the duplicated `<Stack>`/`<Box>`/`<Typography>` layouts in
 * {@link MonsterTraitsSummary}, the entry block in {@link MonsterActionsSummary},
 * and the new class detail sections introduced in later phases.
 */
export default function NamedEntryList({
  items,
  spacing = 1.5,
  emptyFallback = '—',
}: NamedEntryListProps) {
  if (items.length === 0) return <>{emptyFallback}</>;

  return (
    <Stack spacing={spacing} component="div">
      {items.map((item, index) => (
        <Box
          key={item.id ?? `${typeof item.name === 'string' ? item.name : ''}-${index}`}
          component="article"
        >
          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600 }}>
            {item.name}
          </Typography>
          {item.callout != null ? (
            <Typography variant="body2" color="primary" sx={{ mt: 0.25 }}>
              {item.callout}
            </Typography>
          ) : null}
          {item.description != null ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {item.description}
            </Typography>
          ) : null}
          {item.children}
        </Box>
      ))}
    </Stack>
  );
}
