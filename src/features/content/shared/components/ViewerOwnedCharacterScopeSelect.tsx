import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

export type ViewerOwnedCharacterScopeOption = { id: string; label: string }

export type ViewerOwnedCharacterScopeSelectProps = {
  value: 'merged' | string
  onChange: (next: 'merged' | string) => void
  characterOptions: ViewerOwnedCharacterScopeOption[]
}

/**
 * Chooses whether "you own this" reflects all viewer PCs or one selected character (persisted per campaign).
 */
export default function ViewerOwnedCharacterScopeSelect({
  value,
  onChange,
  characterOptions,
}: ViewerOwnedCharacterScopeSelectProps) {
  const selectValue = value === 'merged' ? 'merged' : value

  return (
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <InputLabel id="viewer-owned-scope-label">Owned as</InputLabel>
      <Select
        labelId="viewer-owned-scope-label"
        label="Owned as"
        value={selectValue}
        onChange={(e) => {
          const v = String(e.target.value)
          onChange(v === 'merged' ? 'merged' : v)
        }}
      >
        <MenuItem value="merged">All my characters</MenuItem>
        {characterOptions.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
