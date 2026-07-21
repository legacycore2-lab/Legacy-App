import { AppError } from '../../../shared/errors/app-error'
import { authRepository } from '../repositories/auth.repository'
import type { AppRole, AuthIdentity, AuthUser, LoginCredentials } from '../types/auth.types'

const roles: Record<AppRole, string> = {
  admin: 'مدير النظام',
  accountant: 'محاسب',
  viewer: 'مشاهدة فقط',
}

export function resolveRole(value: unknown): AppRole {
  return value === 'admin' || value === 'accountant' || value === 'viewer' ? value : 'viewer'
}

function resolveDisplayName(identity: AuthIdentity): string {
  const fullName = identity.fullName?.trim()
  const emailName = identity.email.split('@')[0]?.trim()

  return fullName || emailName || 'مستخدم النظام'
}

function mapUser(identity: AuthIdentity): AuthUser {
  const role = resolveRole(identity.role)

  return {
    id: identity.id,
    email: identity.email,
    displayName: resolveDisplayName(identity),
    role,
    roleLabel: roles[role],
  }
}

function identityUser(identity: AuthIdentity | null): AuthUser | null {
  return identity ? mapUser(identity) : null
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

async function withAuthError<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw authError(error)
  }
}

export const authService = {
  getCurrentUser(): Promise<AuthUser | null> {
    return withAuthError(async () => identityUser(await authRepository.getIdentity()))
  },

  subscribe(callback: (user: AuthUser | null) => void): () => void {
    return authRepository.subscribe((identity) => callback(identityUser(identity)))
  },

  signIn(credentials: LoginCredentials): Promise<AuthUser> {
    return withAuthError(async () => mapUser(await authRepository.signIn(credentials)))
  },

  signOut(): Promise<void> {
    return withAuthError(() => authRepository.signOut())
  },
}
