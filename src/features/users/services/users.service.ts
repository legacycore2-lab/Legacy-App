import {
  createUser,
  findUserAdministrationDetails,
  findUsers,
  saveUserProjects,
  setTemporaryPassword,
  updateUser,
  updateUserStatus,
} from '../repositories/users.repository'
import type {
  CreateUserInput,
  EffectivePermission,
  ManagedUser,
  UpdateUserInput,
  UserRole,
  UserStatus,
  UsersFilters,
  UsersSummary,
  UsersViewModel,
} from '../types/users.types'

function matchesQuery(user: ManagedUser, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase('ar')
  if (!normalized) return true

  return [user.displayName, user.email, user.role].join(' ').toLocaleLowerCase('ar').includes(normalized)
}

function isAdmin(user: ManagedUser): boolean {
  return user.role === 'admin' || user.role === 'super_admin'
}

function buildSummary(users: ManagedUser[]): UsersSummary {
  const active = users.filter((user) => user.status === 'active').length
  const admins = users.filter(isAdmin).length
  const suspended = users.filter((user) => user.status === 'suspended').length

  return {
    total: users.length,
    active,
    admins,
    suspended,
  }
}

export async function getUsersViewModel(filters: UsersFilters): Promise<UsersViewModel> {
  const users = await findUsers()
  const filteredUsers = users.filter((user) => {
    if (!matchesQuery(user, filters.query)) return false
    if (filters.role !== 'all' && user.role !== filters.role) return false
    if (filters.status !== 'all' && user.status !== filters.status) return false
    return true
  })

  return {
    users,
    filteredUsers,
    summary: buildSummary(users),
  }
}

function requireText(value: string, label: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${label} مطلوب`)
  return normalized
}

export function addUser(input: CreateUserInput) {
  const email = requireText(input.email, 'البريد الإلكتروني').toLowerCase()
  if (!email.includes('@')) throw new Error('البريد الإلكتروني غير صحيح')
  if (input.password.length < 8) throw new Error('كلمة المرور يجب ألا تقل عن 8 أحرف')
  return createUser({
    ...input,
    email,
    displayName: requireText(input.displayName, 'الاسم'),
    phone: input.phone?.trim() || undefined,
  })
}

export function editUser(input: UpdateUserInput) {
  return updateUser({
    ...input,
    displayName: requireText(input.displayName, 'الاسم'),
    phone: input.phone?.trim() || undefined,
  })
}

export function setUserStatus(id: string, status: UserStatus) {
  return updateUserStatus(id, status)
}

const permissionRoles: Array<{ label: string; roles: UserRole[] }> = [
  { label: 'عرض المشاريع', roles: ['super_admin', 'admin', 'accountant', 'viewer'] },
  { label: 'إدارة القيود والحسابات', roles: ['super_admin', 'admin', 'accountant'] },
  { label: 'إدارة المستخدمين والإعدادات', roles: ['super_admin', 'admin'] },
  { label: 'منح دور مدير عام', roles: ['super_admin'] },
]

export function getEffectivePermissions(role: UserRole): EffectivePermission[] {
  return permissionRoles.map((permission) => ({
    label: permission.label,
    allowed: permission.roles.includes(role),
  }))
}

export function getUserAdministrationDetails(id: string) {
  return findUserAdministrationDetails(id)
}

export function updateUserProjects(id: string, projectIds: string[]) {
  return saveUserProjects(id, [...new Set(projectIds)])
}

export function changeTemporaryPassword(id: string, password: string) {
  if (password.length < 8) throw new Error('كلمة المرور يجب ألا تقل عن 8 أحرف')
  return setTemporaryPassword(id, password)
}
