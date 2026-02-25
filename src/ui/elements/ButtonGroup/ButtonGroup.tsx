import { useEffect } from "react"

export type SelectableOption = {
  id: string
  label: string
  disabled?: boolean
  tooltip?: string
}

type ButtonGroupProps<T extends string | string[] | number> = {
  options: SelectableOption[]
  value?: T
  onChange: (value: T) => void
  multiSelect?: boolean
  autoSelectSingle?: boolean
  size?: 'sm' | 'md'
  theme?: 'primary' | 'secondary'
}

const ButtonGroup = <T extends string | string[] | number>({
  options,
  value,
  onChange,
  multiSelect = false,
  autoSelectSingle = true,
  size = 'md',
  theme = 'primary'
}: ButtonGroupProps<T>) => {
  // Auto-select when only one option exists
  useEffect(() => {
    if (!autoSelectSingle) return
    if (options.length !== 1) return

    if (multiSelect) {
      if (Array.isArray(value) && value.length > 0) return
      onChange([options[0].id] as T)
    } else {
      if (value === options[0].id) return
      onChange(options[0].id as T)
    }
  }, [options, value, multiSelect, autoSelectSingle, onChange])


  const isSelected = (id: string) =>
    multiSelect
      ? Array.isArray(value) && value.includes(id)
      : String(value) === id

  const toggle = (id: string) => {
    if (multiSelect) {
      const current = (value || []) as string[]
      onChange(
        (current.includes(id)
          ? current.filter(v => v !== id)
          : [...current, id]) as T
      )
    } else {
      onChange(id as T)
    }
  }

  return (
    <div className="button-group">
      {options.map(opt => (
        <button
          key={opt.id}
          disabled={opt.disabled}
          title={opt.tooltip}
          className={`btn-theme-${theme} btn-size-${size} ${isSelected(opt.id) ? 'selected' : ''}`}
          onClick={() => toggle(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default ButtonGroup