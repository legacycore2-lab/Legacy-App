import { getSupabaseClient } from '../../../lib/supabase/client'
import type {
  CreateUserInput,
  ManagedUser,
  UpdateUserInput,
  UserAdministrationDetails,
  UserStatus,
} from '../types/users.types'

const serverMessages: Record<string, string> = {
  'Administrator access required': 'تحتاج إلى صلاحية مدير لتنفيذ هذا الإجراء.',
  'Only a super administrator can grant this role': 'فقط المدير العام يمكنه منح دور مدير عام.',
  'Only a super administrator can modify this account': 'فقط المدير العام يمكنه تعديل هذا الحساب.',
  'You cannot change your own role': 'لا يمكنك تغيير دور حسابك الحالي.',
  'You cannot suspend your own account': 'لا يمكنك إيقاف حسابك الحالي.',
  'User already registered': 'البريد الإلكتروني مسجل بالفعل.',
}

async function invoke<T>(method: 'GET' | 'POST' | 'PATCH', body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabaseClient().functions.invoke('users-admin', {
    method,
    body,
  })
  if (error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      const response = (await context
        .clone()
        .json()
        .catch(() => null)) as { error?: unknown } | null
      if (typeof response?.error === 'string') {
        throw new Error(serverMessages[response.error] ?? response.error)
      }
    }
    throw error
  }
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

export function findUserAdministrationDetails(id: string): Promise<UserAdministrationDetails> {
  return invoke('POST', { action: 'details', id })
}

export function saveUserProjects(id: string, projectIds: string[]): Promise<{ ok: true }> {
  return invoke('PATCH', { action: 'projects', id, projectIds })
}

export function setTemporaryPassword(id: string, password: string): Promise<{ ok: true }> {
  return invoke('POST', { action: 'reset_password', id, password })
}
