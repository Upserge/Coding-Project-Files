import type { AppError } from '../types/errors'
import './ErrorBanner.css'

type ErrorBannerProps = {
  error: AppError
  onDismiss: () => void
  onRetry?: () => void
}

export function ErrorBanner({ error, onDismiss, onRetry }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <div className="error-banner__body">
        <p className="error-banner__message">{error.message}</p>
        <p className="error-banner__code">{error.code}</p>
      </div>
      <div className="error-banner__actions">
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        ) : null}
        <button type="button" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  )
}
