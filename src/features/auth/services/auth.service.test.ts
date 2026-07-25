import { describe, expect, it } from 'vitest'
import { resolveRole } from './auth.service'

describe('resolveRole', () => {
  it('accepts super_admin', () => {
    expect(resolveRole('super_admin')).toBe('super_admin')
  })

  it('accepts admin', () => {
    expect(resolveRole('admin')).toBe('admin')
  })

  it('accepts accountant', () => {
    expect(resolveRole('accountant')).toBe('accountant')
  })

  it('accepts viewer', () => {
    expect(resolveRole('viewer')).toBe('viewer')
  })

  it('defaults unknown string to viewer', () => {
    expect(resolveRole('owner')).toBe('viewer')
    expect(resolveRole('superadmin')).toBe('viewer')
    expect(resolveRole('ADMIN')).toBe('viewer')
  })

  it('defaults null and undefined to viewer', () => {
    expect(resolveRole(null)).toBe('viewer')
    expect(resolveRole(undefined)).toBe('viewer')
  })

  it('defaults non-string values to viewer', () => {
    expect(resolveRole(1)).toBe('viewer')
    expect(resolveRole(true)).toBe('viewer')
    expect(resolveRole({})).toBe('viewer')
  })
})
