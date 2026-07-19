import './SearchBar.css'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function SearchBar({ value, onChange, disabled = false }: SearchBarProps) {
  return (
    <label className="search-bar">
      <span className="search-bar__label">Search</span>
      <input
        type="search"
        value={value}
        disabled={disabled}
        placeholder="Name, title, department, or email"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
