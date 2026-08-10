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
      '/contractors',
      '/reports',
      '/users',
      '/settings',
    ]) {
      expect(canAccessRoute('admin', path)).toBe(true)
    }
  })

  it('allows super admins to access every registered route', () => {
    for (const path of [
      '/',
      '/projects',
      '/journal',
      '/accounts',
      '/banks',
      '/advances',
      '/contractors',
      '/reports',
      '/users',
      '/settings',
    ]) {
      expect(canAccessRoute('super_admin', path)).toBe(true)
    }
  })

  it('keeps financial and administrative areas away from viewers', () => {
    expect(canAccessRoute('viewer', '/projects')).toBe(true)
    expect(canAccessRoute('viewer', '/reports')).toBe(false)
    expect(canAccessRoute('viewer', '/journal')).toBe(false)
    expect(canAccessRoute('viewer', '/accounts')).toBe(false)
    expect(canAccessRoute('viewer', '/banks')).toBe(false)
    expect(canAccessRoute('viewer', '/contractors')).toBe(false)
    expect(canAccessRoute('viewer', '/users')).toBe(false)
  })

  it('keeps reports and contractors available to accountants', () => {
    expect(canAccessRoute('accountant', '/reports')).toBe(true)
    expect(canAccessRoute('accountant', '/contractors')).toBe(true)
  })

  it('keeps user and settings administration away from accountants', () => {
    expect(canAccessRoute('accountant', '/users')).toBe(false)
    expect(canAccessRoute('accountant', '/settings')).toBe(false)
  })

  it('keeps the dashboard and projects available to viewers', () => {
    expect(canAccessRoute('viewer', '/')).toBe(true)
    expect(canAccessRoute('viewer', '/projects')).toBe(true)
  })

  it('denies unknown routes by default', () => {
    expect(canAccessRoute('admin', '/unknown')).toBe(false)
  })
})
