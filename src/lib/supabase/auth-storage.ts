type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type AuthPersistence = 'persistent' | 'session'

const modeKey = 'legacy-core:auth-persistence'

function memoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

function browserStorage(name: 'localStorage' | 'sessionStorage'): StorageLike {
  if (typeof window === 'undefined') return memoryStorage()

  try {
    const storage = window[name]
    const probe = `${modeKey}:probe`
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return storage
  } catch {
    return memoryStorage()
  }
}

export function createAuthStorage(
  persistentStorage: StorageLike = browserStorage('localStorage'),
  sessionStorage: StorageLike = browserStorage('sessionStorage'),
) {
  let mode: AuthPersistence = sessionStorage.getItem(modeKey) === 'session' ? 'session' : 'persistent'

  function activeStorage() {
    return mode === 'persistent' ? persistentStorage : sessionStorage
  }

  function inactiveStorage() {
    return mode === 'persistent' ? sessionStorage : persistentStorage
  }

  return {
    storage: {
      getItem(key: string) {
        return activeStorage().getItem(key)
      },
      setItem(key: string, value: string) {
        activeStorage().setItem(key, value)
        inactiveStorage().removeItem(key)
      },
      removeItem(key: string) {
        persistentStorage.removeItem(key)
        sessionStorage.removeItem(key)
      },
    } satisfies StorageLike,

    setPersistence(nextMode: AuthPersistence) {
      mode = nextMode
      if (mode === 'session') {
        sessionStorage.setItem(modeKey, 'session')
        persistentStorage.removeItem(modeKey)
      } else {
        persistentStorage.setItem(modeKey, 'persistent')
        sessionStorage.removeItem(modeKey)
      }
    },

    getPersistence: () => mode,
  }
}

export const supabaseAuthStorage = createAuthStorage()
