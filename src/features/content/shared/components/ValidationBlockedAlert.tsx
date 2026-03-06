/**
 * Renders a validation blocked message with character names as links.
 *
 * Used when a content change (delete/disallow) is blocked because
 * characters reference the content. Shows character names linking to
 * /characters/:id.
 */
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { AppAlert } from '@/ui/primitives';
import type { BlockingEntity } from './EntryEditorLayout';

const MAX_NAMES_SHOWN = 5;

export interface ValidationBlockedAlertProps {
  contentType: string;
  mode: 'delete' | 'disallow';
  blockingEntities: BlockingEntity[];
  onClose?: () => void;
}

const ValidationBlockedAlert = ({
  contentType,
  mode,
  blockingEntities,
  onClose,
}: ValidationBlockedAlertProps) => {
  const count = blockingEntities.length;
  const noun = count === 1 ? 'character' : 'characters';
  const displayEntities = blockingEntities.slice(0, MAX_NAMES_SHOWN);
  const remaining = count - MAX_NAMES_SHOWN;

  const header = `This ${contentType} is currently used by:`;
  const footer =
    mode === 'delete'
      ? `Remove the ${contentType} from those ${noun} before deleting.`
      : `Remove the ${contentType} from those ${noun} before disabling it for the campaign.`;

  return (
    <AppAlert tone="warning" onClose={onClose}>
      <Box component="span" sx={{ display: 'block' }}>
        <Typography component="span" variant="body2" sx={{ display: 'block' }}>
          {header}
        </Typography>
        <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
          {displayEntities.map((entity) => (
            <Typography
              key={entity.id}
              component="span"
              variant="body2"
              sx={{ display: 'block' }}
            >
              {entity.to ? (
                <MuiLink component={Link} to={entity.to} underline="hover">
                  {entity.label}
                </MuiLink>
              ) : (
                entity.label
              )}
            </Typography>
          ))}
          {remaining > 0 && (
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ display: 'block' }}
            >
              and {remaining} more
            </Typography>
          )}
        </Box>
        <Typography
          component="span"
          variant="body2"
          sx={{ display: 'block', mt: 1 }}
        >
          {footer}
        </Typography>
      </Box>
    </AppAlert>
  );
};

export default ValidationBlockedAlert;
