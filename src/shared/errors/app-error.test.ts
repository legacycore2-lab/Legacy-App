import { describe, expect, it } from 'vitest'
import { AppError, PermissionError, isPermissionError, toErrorMessage } from './app-error'

describe('isPermissionError', () => {
  it('recognises PermissionError', () => {
    expect(isPermissionError(new PermissionError())).toBe(true)
  })

  it('recognises PostgreSQL insufficient privilege code', () => {
    expect(isPermissionError({ code: '42501', message: 'denied' })).toBe(true)
  })

  it('recognises permission AppError code', () => {
    expect(isPermissionError(new AppError('denied', 'PERMISSION_DENIED'))).toBe(true)
  })

  it('does not classify a generic error by message text', () => {
    expect(isPermissionError(new Error('permission denied by network proxy'))).toBe(false)
  })

  it('does not classify unrelated Supabase errors', () => {
    expect(isPermissionError({ code: 'PGRST116', message: 'not found' })).toBe(false)
  })
})

describe('toErrorMessage', () => {
  it('returns AppError message', () => {
    expect(toErrorMessage(new AppError('واضح', 'TEST'), 'بديل')).toBe('واضح')
  })

  it('returns fallback for unknown values', () => {
    expect(toErrorMessage(null, 'بديل')).toBe('بديل')
  })
})
