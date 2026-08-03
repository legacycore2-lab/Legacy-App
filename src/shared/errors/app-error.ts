export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'AppError'
  }
}

export class DataValidationError extends AppError {
  constructor(message: string) {
    super(message, 'DATA_VALIDATION_ERROR')
  }
}

export class PermissionError extends AppError {
  constructor(message = 'ليس لديك صلاحية لتنفيذ هذه العملية.', options?: ErrorOptions) {
    super(message, 'PERMISSION_DENIED', options)
    this.name = 'PermissionError'
  }
}

const permissionCodes = new Set(['42501', 'PGRST301', 'PERMISSION_DENIED'])

export function isPermissionError(error: unknown): boolean {
  if (error instanceof PermissionError) return true
  if (error instanceof AppError && permissionCodes.has(error.code)) return true
  if (!error || typeof error !== 'object') return false

  const record = error as Record<string, unknown>
  const code = typeof record.code === 'string' ? record.code : ''
  return permissionCodes.has(code)
}

export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) return error.message
  if (error instanceof Error) return error.message
  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>)['message'] === 'string'
  ) {
    return (error as Record<string, unknown>)['message'] as string
  }
  return fallback
}
