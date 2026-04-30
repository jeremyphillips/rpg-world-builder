import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { NamedEntryList } from '@/features/content/shared/components';
import type { SubclassSelection } from '@/features/content/classes/domain/types/subclass.types';

export type SubclassOptionsSummaryProps = {
  definitions: SubclassSelection | undefined;
};

/** Detail friendly view: scaffold + option list (`NamedEntryList` + selection level context). */
export default function SubclassOptionsSummary({
  definitions,
}: SubclassOptionsSummaryProps) {
  if (!definitions) return '—';

  const opts = definitions.options ?? [];
  const lvl = definitions.selectionLevel;
  const metaParts = [
    definitions.id?.trim(),
    lvl != null ? `Choice at level ${lvl}` : null,
    `${opts.length} option(s)`,
  ].filter(Boolean) as string[];

  return (
    <Stack spacing={1.25} component="div">
      <Stack spacing={0.25}>
        <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600 }}>
          {definitions.name.trim() ? definitions.name : 'Subclass selection'}
        </Typography>
        {metaParts.length > 0 ? (
          <Typography variant="body2" color="text.secondary">
            {metaParts.join(' · ')}
          </Typography>
        ) : null}
      </Stack>
      <NamedEntryList
        items={opts.map((opt) => ({
          id: opt.id,
          name: opt.name,
          description: opt.description?.trim() ? opt.description : undefined,
        }))}
        emptyFallback={<Typography variant="body2">No subclass options configured.</Typography>}
      />
    </Stack>
  );
}
