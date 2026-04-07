import type { ReactNode } from 'react';
import Popover from '@mui/material/Popover';

type LocationMapEditorTrayVariantPopoverProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Shared popover shell for family-scoped variant lists (place tool, paint tray).
 */
export function LocationMapEditorTrayVariantPopover({
  anchorEl,
  open,
  onClose,
  children,
}: LocationMapEditorTrayVariantPopoverProps) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      slotProps={{
        paper: { sx: { minWidth: 200, maxWidth: 280 } },
      }}
    >
      {children}
    </Popover>
  );
}
