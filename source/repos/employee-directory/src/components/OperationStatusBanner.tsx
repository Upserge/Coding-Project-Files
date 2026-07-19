import {
  getOperationMessage,
  isOperationBusy,
  type OperationState,
} from '../types/operation'
import './OperationStatusBanner.css'

type OperationStatusBannerProps = {
  operation: OperationState
}

export function OperationStatusBanner({
  operation,
}: OperationStatusBannerProps) {
  if (operation.phase === 'idle') {
    return null
  }

  const message = getOperationMessage(operation)
  const showSpinner = isOperationBusy(operation.phase)

  return (
    <div
      className={`status-strip status-strip--${operation.phase}`}
      role="status"
      aria-live="polite"
    >
      {showSpinner ? <span className="status-strip__spinner" aria-hidden="true" /> : null}
      <span>{message}</span>
    </div>
  )
}
