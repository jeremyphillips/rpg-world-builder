import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import type { CellSelectionInspectorProps } from '../inspectors/CellSelectionInspector';
import { SelectionTab } from '../SelectionTab';
import type { StairWorkspaceInspect } from '../inspectors/selectionInspectorTypes';

const theme = createTheme();

const stairWorkspaceInspect: StairWorkspaceInspect = {
  currentFloorLocationId: 'floor-1',
  candidateTargetFloors: [],
};

type SelectionPanelTestOverrides = Omit<
  Partial<ComponentProps<typeof SelectionTab>>,
  'cellPanelProps'
> & {
  cellPanelProps?: Partial<CellSelectionInspectorProps>;
};

function renderSelection(
  selection: ComponentProps<typeof SelectionTab>['selection'],
  overrides: SelectionPanelTestOverrides = {},
) {
  const {
    cellPanelProps: cellOverrides = {},
    pathEntries = [],
    edgeEntries = [],
    regionEntries = [],
    onUpdateRegionEntry = vi.fn(),
    ...restOverrides
  } = overrides;

  const cellPanelProps: CellSelectionInspectorProps = {
    selectedCellId: null,
    hostScale: 'floor',
    locations: [],
    linkedLocationByCellId: {},
    objectsByCellId: {},
    cellFillByCellId: {},
    onUpdateLinkedLocation: vi.fn(),
    onUpdateCellObjects: vi.fn(),
    ...cellOverrides,
  };

  render(
    <ThemeProvider theme={theme}>
      <SelectionTab
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

describe('SelectionTab', () => {
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

  it('cell: fill-first inspector uses terrain rail template and presentation rows (no host caption)', () => {
    renderSelection(
      { type: 'cell', cellId: '13,1' },
      {
        cellPanelProps: {
          selectedCellId: '13,1',
          hostName: 'Nehwon',
          hostScale: 'world',
          hostLocationId: 'host-1',
          cellFillByCellId: {
            '13,1': { familyId: 'forest', variantId: 'temperate_dense' },
          },
        },
      },
    );
    expect(screen.getByText('Terrain')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dense forest' })).toBeInTheDocument();
    expect(screen.getByText('Cell 13,1')).toBeInTheDocument();
    expect(screen.getByText('Biome:')).toBeInTheDocument();
    expect(screen.getByText('temperate')).toBeInTheDocument();
    expect(screen.getByText('Density:')).toBeInTheDocument();
    expect(screen.getByText('dense')).toBeInTheDocument();
    expect(screen.queryByText(/Nehwon/)).not.toBeInTheDocument();
    expect(screen.queryByText(/world map/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Location:/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Label/i)).not.toBeInTheDocument();
  });

  it('cell: floor fill uses Surface section and material row', () => {
    renderSelection(
      { type: 'cell', cellId: '6,1' },
      {
        cellPanelProps: {
          selectedCellId: '6,1',
          hostScale: 'floor',
          cellFillByCellId: {
            '6,1': { familyId: 'floor', variantId: 'stone' },
          },
        },
      },
    );
    expect(screen.getByText('Surface')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stone floor' })).toBeInTheDocument();
    expect(screen.getByText('Cell 6,1')).toBeInTheDocument();
    expect(screen.getByText('Material:')).toBeInTheDocument();
    expect(screen.getByText('stone')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Label/i)).not.toBeInTheDocument();
  });

  it('cell: does not show generic linked-location or add-object UI on Selection tab', () => {
    renderSelection({ type: 'cell', cellId: '0,0' }, { cellPanelProps: { selectedCellId: '0,0' } });
    expect(screen.queryByText(/Linked location/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Add object/i)).not.toBeInTheDocument();
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
    expect(screen.getByText('Material:')).toBeInTheDocument();
    expect(screen.getByText('wood')).toBeInTheDocument();
    expect(screen.getByText('Shape:')).toBeInTheDocument();
    expect(screen.getByText('rectangle')).toBeInTheDocument();
  });

  it('edge: mounts edge inspector with door label when kind is door (legacy identity)', () => {
    const edgeId = 'between:0,0|1,0';
    renderSelection(
      { type: 'edge', edgeId },
      {
        edgeEntries: [{ edgeId, kind: 'door' }],
      },
    );
    expect(screen.getByRole('heading', { name: 'Door' })).toBeInTheDocument();
    expect(screen.getByText('Between Cell 0,0 and Cell 1,0')).toBeInTheDocument();
    expect(screen.getByText('Material:')).toBeInTheDocument();
    expect(screen.getByText('Form:')).toBeInTheDocument();
    expect(
      screen.getByText(/This segment predates saved door\/window identity/i),
    ).toBeInTheDocument();
  });

  it('edge: enriched door uses persisted variant metadata and title', () => {
    const edgeId = 'between:0,0|1,0';
    renderSelection(
      { type: 'edge', edgeId },
      {
        edgeEntries: [
          {
            edgeId,
            kind: 'door',
            authoredPlaceKindId: 'door',
            variantId: 'double_wood',
          },
        ],
      },
    );
    expect(screen.getByRole('heading', { name: 'Double Door' })).toBeInTheDocument();
    expect(screen.getByText(/double leaf/i)).toBeInTheDocument();
  });

  it('edge: label field is editable when door has authored identity', () => {
    const edgeId = 'between:0,0|1,0';
    renderSelection(
      { type: 'edge', edgeId },
      {
        edgeEntries: [
          {
            edgeId,
            kind: 'door',
            authoredPlaceKindId: 'door',
            variantId: 'single_wood',
            label: 'Front',
          },
        ],
        onPatchEdgeEntry: vi.fn(),
      },
    );
    const field = screen.getByLabelText('Label') as HTMLInputElement;
    expect(field.disabled).toBe(false);
    expect(field.value).toBe('Front');
  });

  it('edge: mounts edge inspector with window label and default variant presentation', () => {
    const edgeId = 'perimeter:0,0|E';
    renderSelection(
      { type: 'edge', edgeId },
      {
        edgeEntries: [{ edgeId, kind: 'window' }],
      },
    );
    expect(screen.getByRole('heading', { name: 'Window' })).toBeInTheDocument();
    expect(screen.getByText('Cell 0,0 · east edge')).toBeInTheDocument();
    expect(screen.getByText('Material:')).toBeInTheDocument();
    expect(screen.getByText('glass')).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('plain')).toBeInTheDocument();
  });

  it('edge: wall segment uses structure-style copy', () => {
    const edgeId = 'between:1,1|1,2';
    renderSelection(
      { type: 'edge', edgeId },
      {
        edgeEntries: [{ edgeId, kind: 'wall' }],
      },
    );
    expect(screen.getByRole('heading', { name: 'Wall' })).toBeInTheDocument();
    expect(screen.getByText('Boundary wall segment.')).toBeInTheDocument();
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

  it('region: mounts region form with shared Map header and region name as title', () => {
    renderSelection(
      { type: 'region', regionId: 'reg-1' },
      {
        regionEntries: [
          {
            id: 'reg-1',
            name: 'Harbor District',
            description: '',
            colorKey: 'regionBlue',
          },
        ],
      },
    );
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Harbor District' })).toBeInTheDocument();
    expect(screen.getByText('Overlay region')).toBeInTheDocument();
  });

  it('region: shows Remove from map when onRemoveRegionFromMap is provided', () => {
    const onRemoveRegionFromMap = vi.fn();
    renderSelection(
      { type: 'region', regionId: 'reg-1' },
      {
        regionEntries: [
          {
            id: 'reg-1',
            name: 'Harbor District',
            description: '',
            colorKey: 'regionBlue',
          },
        ],
        onRemoveRegionFromMap,
      },
    );
    expect(screen.getByRole('button', { name: 'Remove from map' })).toBeInTheDocument();
  });

  it('edge-run: wall uses geometry-style run title', () => {
    const anchor = 'between:0,0|1,0';
    renderSelection({
      type: 'edge-run',
      kind: 'wall',
      edgeIds: [anchor],
      axis: 'horizontal',
      anchorEdgeId: anchor,
    });
    expect(screen.getByRole('heading', { name: 'Horizontal Wall run' })).toBeInTheDocument();
    expect(screen.getByText('Straight run · 1 segment')).toBeInTheDocument();
    expect(screen.getByText(/Anchor: Between Cell 0,0 and Cell 1,0/)).toBeInTheDocument();
  });

  it('edge-run: door uses registry object-first title', () => {
    const anchor = 'perimeter:2,3|E';
    renderSelection(
      {
        type: 'edge-run',
        kind: 'door',
        edgeIds: [anchor],
        axis: 'vertical',
        anchorEdgeId: anchor,
      },
      {
        edgeEntries: [
          { edgeId: anchor, kind: 'door', authoredPlaceKindId: 'door', variantId: 'single_wood' },
        ],
      },
    );
    expect(screen.getByRole('heading', { name: 'Door' })).toBeInTheDocument();
    expect(screen.getByText('Cell 2,3 · east edge')).toBeInTheDocument();
    expect(screen.getByText('Material:')).toBeInTheDocument();
    expect(screen.queryByText(/Straight run/i)).not.toBeInTheDocument();
  });

  it('edge-run: window uses registry object-first title and presentation rows', () => {
    const anchor = 'between:0,0|0,1';
    renderSelection(
      {
        type: 'edge-run',
        kind: 'window',
        edgeIds: [anchor],
        axis: 'horizontal',
        anchorEdgeId: anchor,
      },
      {
        edgeEntries: [
          {
            edgeId: anchor,
            kind: 'window',
            authoredPlaceKindId: 'window',
            variantId: 'glass',
          },
        ],
      },
    );
    expect(screen.getByRole('heading', { name: 'Window' })).toBeInTheDocument();
    expect(screen.getByText('Between Cell 0,0 and Cell 0,1')).toBeInTheDocument();
    expect(screen.getByText('Material:')).toBeInTheDocument();
    expect(screen.getByText('glass')).toBeInTheDocument();
    expect(screen.queryByText(/Straight run/i)).not.toBeInTheDocument();
  });
});
