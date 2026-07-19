import type { SortDirection } from '../utils/sortEmployees'
import './SortControls.css'

type SortControlsProps = {
  direction: SortDirection
  onChange: (direction: SortDirection) => void
  disabled?: boolean
}

const NEXT_DIRECTION: Record<SortDirection, SortDirection> = {
  asc: 'desc',
  desc: 'asc',
}

const DIRECTION_LABEL: Record<SortDirection, string> = {
  asc: 'A–Z',
  desc: 'Z–A',
}

export function SortControls({
  direction,
  onChange,
  disabled = false,
}: SortControlsProps) {
  return (
    <button
      type="button"
      className="sort-controls"
      disabled={disabled}
      aria-label={`Sort alphabetically, currently ${DIRECTION_LABEL[direction]}`}
      onClick={() => onChange(NEXT_DIRECTION[direction])}
    >
      Sort {DIRECTION_LABEL[direction]}
    </button>
  )
}
