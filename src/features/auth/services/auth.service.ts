import type { Session, User } from '@supabase/supabase-js'
import { AppError } from '../../../shared/errors/app-error'
import { authRepository } from '../repositories/auth.repository'
import type { AppRole, AuthUser, LoginCredentials } from '../types/auth.types'

const roles: Record<AppRole, string> = {
  admin: 'مدير النظام',
  accountant: 'محاسب',
  viewer: 'مشاهدة فقط',
}

export function resolveRole(value: unknown): AppRole {
  return value === 'admin' || value === 'accountant' || value === 'viewer' ? value : 'viewer'
}

function mapUser(user: User): AuthUser {
  const role = resolveRole(user.app_metadata.role)
  const email = user.email ?? ''
  const metadataName = user.user_metadata.full_name
  const displayName =
    typeof metadataName === 'string' && metadataName.trim() ? metadataName.trim() : email.split('@')[0]

  return {
    id: user.id,
    email,
    displayName: displayName || 'مستخدم النظام',
    role,
    roleLabel: roles[role],
  }
}

function sessionUser(session: Session | null): AuthUser | null {
  return session ? mapUser(session.user) : null
}

function authError(error: unknown): AppError {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('invalid login credentials')) {
    return new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'INVALID_CREDENTIALS', {
      cause: error,
    })
  }

  if (message.includes('email not confirmed')) {
    return new AppError('يجب تأكيد البريد الإلكتروني أولاً.', 'EMAIL_NOT_CONFIRMED', { cause: error })
  }

  return new AppError('تعذر الاتصال بالنظام. حاول مرة أخرى.', 'AUTH_FAILED', { cause: error })
}

export const authService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      return sessionUser(await authRepository.getSession())
    } catch (error) {
      throw authError(error)
    }
  },

  subscribe(callback: (user: AuthUser | null) => void): () => void {
    return authRepository.subscribe((_event, session) => callback(sessionUser(session)))
  },

  async signIn(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      return sessionUser(await authRepository.signIn(credentials))!
    } catch (error) {
      throw authError(error)
    }
  },

  async signOut(): Promise<void> {
    try {
      await authRepository.signOut()
    } catch (error) {
      throw authError(error)
    }
  },
}
