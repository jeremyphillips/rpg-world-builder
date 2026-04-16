import MuiPopover, { type PopoverProps } from '@mui/material/Popover';

const defaultAnchor = { vertical: 'bottom' as const, horizontal: 'left' as const };
const defaultTransform = { vertical: 'top' as const, horizontal: 'left' as const };

export type AppPopoverProps = PopoverProps;

/**
 * Thin app wrapper around MUI `Popover` with consistent defaults for toolbar / compact overlays.
 */
export default function AppPopover({
  anchorOrigin = defaultAnchor,
  transformOrigin = defaultTransform,
  ...rest
}: PopoverProps) {
  return (
    <MuiPopover
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      {...rest}
    />
  );
}
