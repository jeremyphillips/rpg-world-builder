import type { ReactNode } from 'react';
import { useMemo } from 'react';
import Box from '@mui/material/Box';

import { AppTabs, AppTab } from '@/ui/patterns';

import type { LocationEditorRailSection } from './locationEditorRail.types';

const SECTIONS: LocationEditorRailSection[] = ['location', 'map', 'selection'];

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
  /** Location-level metadata only (forms, policy) — not map tool palettes. */
  locationPanel: ReactNode;
  /** Map authoring options / place palette — not location metadata. */
  mapPanel: ReactNode;
  /** Inspector for the current map selection. */
  selectionPanel: ReactNode;
};

/**
 * Right-rail tabs: **Location** (metadata), **Map** (authoring tools), **Selection** (inspector).
 * Numeric `AppTabs` values are an internal detail; parents pass `LocationEditorRailSection`.
 */
export function LocationEditorRailSectionTabs({
  section,
  onSectionChange,
  locationPanel,
  mapPanel,
  selectionPanel,
}: LocationEditorRailSectionTabsProps) {
  const tabIndex = useMemo(() => sectionToTabIndex(section), [section]);

  const activePanel = useMemo(() => {
    switch (section) {
      case 'location':
        return locationPanel;
      case 'map':
        return mapPanel;
      case 'selection':
        return selectionPanel;
    }
  }, [section, locationPanel, mapPanel, selectionPanel]);

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
        <AppTab label="Map" />
        <AppTab label="Selection" />
      </AppTabs>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2.5 }}>{activePanel}</Box>
    </Box>
  );
}
