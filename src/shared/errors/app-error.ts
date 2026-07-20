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
  return error instanceof AppError ? error.message : fallback
}
