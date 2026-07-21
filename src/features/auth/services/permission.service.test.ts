import { describe, expect, it } from 'vitest'
import { canAccessRoute } from './permission.service'

describe('route permissions', () => {
  it('allows administrators to access every registered route', () => {
    for (const path of [
      '/',
      '/projects',
      '/journal',
      '/accounts',
      '/banks',
      '/advances',
      '/reports',
      '/users',
      '/settings',
    ]) {
      expect(canAccessRoute('admin', path)).toBe(true)
    }
  })

  it('keeps financial and administrative areas away from viewers', () => {
    expect(canAccessRoute('viewer', '/projects')).toBe(true)
    expect(canAccessRoute('viewer', '/reports')).toBe(true)
    expect(canAccessRoute('viewer', '/journal')).toBe(false)
    expect(canAccessRoute('viewer', '/accounts')).toBe(false)
    expect(canAccessRoute('viewer', '/users')).toBe(false)
  })

  it('denies unknown routes by default', () => {
    expect(canAccessRoute('admin', '/unknown')).toBe(false)
  })
})
