import { getSupabaseClient } from '../../../lib/supabase/client'
import type { CreateUserInput, ManagedUser, UpdateUserInput, UserStatus } from '../types/users.types'

async function invoke<T>(method: 'GET' | 'POST' | 'PATCH', body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabaseClient().functions.invoke('users-admin', {
    method,
    body,
  })
  if (error) throw error
  return data as T
}

export function findUsers(): Promise<ManagedUser[]> {
  return invoke<ManagedUser[]>('GET')
}

export function createUser(input: CreateUserInput): Promise<{ id: string }> {
  return invoke('POST', { ...input })
}

export function updateUser(input: UpdateUserInput): Promise<{ ok: true }> {
  return invoke('PATCH', { ...input })
}

export function updateUserStatus(id: string, status: UserStatus): Promise<{ ok: true }> {
  return invoke('PATCH', { id, status })
}
