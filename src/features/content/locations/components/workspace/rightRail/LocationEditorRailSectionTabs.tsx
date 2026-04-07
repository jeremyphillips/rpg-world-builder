import type { ReactNode } from 'react';
import { useMemo } from 'react';
import Box from '@mui/material/Box';

import { AppTabs, AppTab } from '@/ui/patterns';

import type { LocationEditorRailSection } from './types';

const SECTIONS: LocationEditorRailSection[] = ['location', 'selection'];

function sectionToTabIndex(section: LocationEditorRailSection): number {
  return SECTIONS.indexOf(section);
}

function tabIndexToSection(index: number): LocationEditorRailSection {
  return SECTIONS[index] ?? 'location';
}

export type LocationEditorRailSectionTabsProps = {
  /** Visible section; route state should use this string union, not numeric tab indices. */
  section: LocationEditorRailSection;
  onSectionChange: (section: LocationEditorRailSection) => void;
  /** Location-level metadata only (forms, policy). Map tools live on the canvas toolbar. */
  locationPanel: ReactNode;
  /** Inspector for the current map selection. */
  selectionPanel: ReactNode;
};

/**
 * Right-rail tabs: **Location** (metadata) and **Selection** (map inspector). Map authoring tools
 * are on the left toolbar next to the canvas, not in this rail.
 * Numeric `AppTabs` values are an internal detail; parents pass `LocationEditorRailSection`.
 */
export function LocationEditorRailSectionTabs({
  section,
  onSectionChange,
  locationPanel,
  selectionPanel,
}: LocationEditorRailSectionTabsProps) {
  const tabIndex = useMemo(() => sectionToTabIndex(section), [section]);

  const activePanel = useMemo(() => {
    switch (section) {
      case 'location':
        return locationPanel;
      case 'selection':
        return selectionPanel;
    }
  }, [section, locationPanel, selectionPanel]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      <AppTabs
        value={tabIndex}
        onChange={(_e, v) => onSectionChange(tabIndexToSection(v as number))}
        variant="fullWidth"
        sx={{ flexShrink: 0 }}
      >
        <AppTab label="Location" />
        <AppTab label="Selection" />
      </AppTabs>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2.5 }}>{activePanel}</Box>
    </Box>
  );
}
