import { describe, expect, it } from 'vitest'
import { resolveRole } from './auth.service'

describe('resolveRole', () => {
  it('accepts the supported application roles', () => {
    expect(resolveRole('admin')).toBe('admin')
    expect(resolveRole('accountant')).toBe('accountant')
    expect(resolveRole('viewer')).toBe('viewer')
  })

  it('defaults unknown and missing roles to viewer', () => {
    expect(resolveRole('owner')).toBe('viewer')
    expect(resolveRole(undefined)).toBe('viewer')
  })
})
