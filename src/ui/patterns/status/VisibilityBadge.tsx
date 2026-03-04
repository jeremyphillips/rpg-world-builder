import { AppBadge } from '@/ui/primitives'
import type { AppBadgeTone } from '@/ui/types'
import type { Visibility } from '@/shared/types/visibility'
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const SCOPE_META: Record<
  Visibility['scope'],
  { icon: React.ReactElement; label: string; tone: AppBadgeTone }
> = {
  public: {
    icon: <PublicIcon fontSize="small" />,
    label: 'Public',
    tone: 'success',
  },
  restricted: {
    icon: <LockIcon fontSize="small" />,
    label: 'Private',
    tone: 'warning',
  },
  dm: {
    icon: <VisibilityOffIcon fontSize="small" />,
    label: 'DM Only',
    tone: 'info',
  },
};

export default function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const meta = SCOPE_META[visibility.scope];

  return (
    <AppBadge
      icon={meta.icon}
      label={meta.label}
      tone={meta.tone}
      size="small"
      variant="outlined"
    />
  );
};