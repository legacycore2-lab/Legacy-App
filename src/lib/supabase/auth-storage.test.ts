import { describe, expect, it } from 'vitest'
import { createAuthStorage } from './auth-storage'

function fakeStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  }
}

describe('auth storage', () => {
  it('persists remembered sessions in persistent storage', () => {
    const persistent = fakeStorage()
    const session = fakeStorage()
    const auth = createAuthStorage(persistent, session)

    auth.setPersistence('persistent')
    auth.storage.setItem('token', 'remembered')

    expect(persistent.getItem('token')).toBe('remembered')
    expect(session.getItem('token')).toBeNull()
  })

  it('keeps non-remembered sessions in the current tab only', () => {
    const persistent = fakeStorage()
    const session = fakeStorage()
    const auth = createAuthStorage(persistent, session)

    auth.setPersistence('session')
    auth.storage.setItem('token', 'temporary')

    expect(session.getItem('token')).toBe('temporary')
    expect(persistent.getItem('token')).toBeNull()
    expect(createAuthStorage(persistent, session).getPersistence()).toBe('session')
  })
})
