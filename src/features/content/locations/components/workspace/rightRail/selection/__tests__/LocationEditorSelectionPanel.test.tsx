import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import type { LocationCellAuthoringPanelProps } from '../../panels/LocationCellAuthoringPanel';
import { LocationEditorSelectionPanel } from '../LocationEditorSelectionPanel';
import type { StairWorkspaceInspect } from '../LocationMapSelectionInspectors';

const theme = createTheme();

const stairWorkspaceInspect: StairWorkspaceInspect = {
  currentFloorLocationId: 'floor-1',
  candidateTargetFloors: [],
};

function renderSelection(
  selection: ComponentProps<typeof LocationEditorSelectionPanel>['selection'],
  overrides: Partial<ComponentProps<typeof LocationEditorSelectionPanel>> = {},
) {
  const {
    cellPanelProps: cellOverrides = {},
    pathEntries = [],
    edgeEntries = [],
    regionEntries = [],
    onUpdateRegionEntry = vi.fn(),
    ...restOverrides
  } = overrides;

  const cellPanelProps: LocationCellAuthoringPanelProps = {
    selectedCellId: null,
    hostScale: 'floor',
    locations: [],
    linkedLocationByCellId: {},
    objectsByCellId: {},
    onUpdateLinkedLocation: vi.fn(),
    onUpdateCellObjects: vi.fn(),
    ...cellOverrides,
  };

  render(
    <ThemeProvider theme={theme}>
      <LocationEditorSelectionPanel
        selection={selection}
        cellPanelProps={cellPanelProps}
        stairWorkspaceInspect={stairWorkspaceInspect}
        pathEntries={pathEntries}
        edgeEntries={edgeEntries}
        regionEntries={regionEntries}
        onUpdateRegionEntry={onUpdateRegionEntry}
        {...restOverrides}
      />
    </ThemeProvider>,
  );
}

describe('LocationEditorSelectionPanel', () => {
  it('none: prompts to select something', () => {
    renderSelection({ type: 'none' });
    expect(screen.getByText(/Select a cell, region, path, edge, or object on the map/i)).toBeInTheDocument();
  });

  it('cell: mounts cell inspector with shared Map / Cell header', () => {
    renderSelection({ type: 'cell', cellId: '2,3' }, { cellPanelProps: { selectedCellId: '2,3' } });
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cell' })).toBeInTheDocument();
    expect(screen.getByText('Cell 2,3')).toBeInTheDocument();
  });

  it('object: mounts placed-object template with registry title', () => {
    renderSelection(
      { type: 'object', cellId: '1,1', objectId: 'obj-a' },
      {
        cellPanelProps: {
          selectedCellId: null,
          hostScale: 'floor',
          locations: [],
          linkedLocationByCellId: {},
          objectsByCellId: {
            '1,1': [
              {
                id: 'obj-a',
                kind: 'table',
                label: '',
                authoredPlaceKindId: 'table',
              },
            ],
          },
          onUpdateLinkedLocation: vi.fn(),
          onUpdateCellObjects: vi.fn(),
        },
      },
    );
    expect(screen.getByRole('heading', { name: 'Table' })).toBeInTheDocument();
    expect(screen.getByText('Cell 1,1')).toBeInTheDocument();
  });

  it('edge: mounts edge inspector with door label when kind is door', () => {
    renderSelection(
      { type: 'edge', edgeId: 'between:0,0|1,0|E' },
      {
        edgeEntries: [{ edgeId: 'between:0,0|1,0|E', kind: 'door' }],
      },
    );
    expect(screen.getByRole('heading', { name: 'Door' })).toBeInTheDocument();
  });

  it('path: mounts path inspector with Path title', () => {
    renderSelection(
      { type: 'path', pathId: 'path-1' },
      {
        pathEntries: [{ id: 'path-1', kind: 'road', cellIds: ['0,0', '1,0'] }],
      },
    );
    expect(screen.getByRole('heading', { name: 'Path' })).toBeInTheDocument();
    expect(screen.getByText('Chain · 2 cells')).toBeInTheDocument();
  });
});
