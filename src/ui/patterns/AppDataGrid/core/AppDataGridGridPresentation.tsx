import { DataGrid } from '@mui/x-data-grid'
import type {
  GridCallbackDetails,
  GridColDef,
  GridRowClassNameParams,
  GridRowSelectionModel,
} from '@mui/x-data-grid'
import Box from '@mui/material/Box'
import GlobalStyles from '@mui/material/GlobalStyles'
import Typography from '@mui/material/Typography'

type AppDataGridGridPresentationProps<T> = {
  filteredRows: T[]
  muiColumns: GridColDef[]
  getRowId: (row: T) => string
  getRowClassName?: (params: GridRowClassNameParams) => string
  loading: boolean
  pageSizeOptions: number[]
  density: 'compact' | 'standard' | 'comfortable'
  height: number | string
  emptyMessage: string
  multiSelect: boolean
  rowSelectionModel?: GridRowSelectionModel
  onRowSelectionModelChange?: (
    model: GridRowSelectionModel,
    details: GridCallbackDetails,
  ) => void
}

export default function AppDataGridGridPresentation<T>({
  filteredRows,
  muiColumns,
  getRowId,
  getRowClassName,
  loading,
  pageSizeOptions,
  density,
  height,
  emptyMessage,
  multiSelect,
  rowSelectionModel,
  onRowSelectionModelChange,
}: AppDataGridGridPresentationProps<T>) {
  return (
    <>
      <GlobalStyles
        styles={{
          '.AppDataGrid-row--disabled': {
            opacity: '0.6 !important',
          },
        }}
      />
      <Box sx={{ height, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={muiColumns}
          getRowId={(row) => getRowId(row as T)}
          getRowClassName={getRowClassName}
          sx={{
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
          loading={loading}
          pageSizeOptions={pageSizeOptions}
          density={density}
          checkboxSelection={multiSelect}
          disableRowSelectionOnClick={!multiSelect}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={onRowSelectionModelChange}
          disableColumnFilter
          disableColumnMenu
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </Box>
            ),
          }}
        />
      </Box>
    </>
  )
}
