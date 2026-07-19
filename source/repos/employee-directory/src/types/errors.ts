export type AppErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'DUPLICATE_EMAIL'
  | 'NETWORK'
  | 'UNKNOWN'

export type AppError = {
  code: AppErrorCode
  message: string
  field?: string
}

const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  VALIDATION: 'Please fix the highlighted fields and try again.',
  NOT_FOUND: 'That employee could not be found.',
  DUPLICATE_EMAIL: 'An employee with this email already exists.',
  NETWORK: 'Network request failed. Check your connection and retry.',
  UNKNOWN: 'An unexpected error occurred.',
}

export function createAppError(
  code: AppErrorCode,
  message?: string,
  field?: string,
): AppError {
  return {
    code,
    message: message ?? ERROR_MESSAGES[code],
    field,
  }
}

export function isAppError(value: unknown): value is AppError {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<AppError>
  return typeof candidate.code === 'string' && typeof candidate.message === 'string'
}

export function toAppError(value: unknown): AppError {
  if (isAppError(value)) {
    return value
  }

  return createAppError('UNKNOWN')
}
