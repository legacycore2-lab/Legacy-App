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
