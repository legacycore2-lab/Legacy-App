import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createUser,
  findUsers,
  saveUserProjects,
  setTemporaryPassword,
  updateUserStatus,
} from '../repositories/users.repository'
import type { ManagedUser, UsersFilters } from '../types/users.types'
import {
  addUser,
  changeTemporaryPassword,
  getEffectivePermissions,
  getUsersViewModel,
  setUserStatus,
  updateUserProjects,
} from './users.service'

vi.mock('../repositories/users.repository', () => ({
  findUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  updateUserStatus: vi.fn(),
  findUserAdministrationDetails: vi.fn(),
  saveUserProjects: vi.fn(),
  setTemporaryPassword: vi.fn(),
}))

const users: ManagedUser[] = [
  {
    id: 'super-admin',
    displayName: 'أحمد المدير',
    email: 'ahmed@example.com',
    role: 'super_admin',
    status: 'active',
    lastLoginAt: null,
    createdAt: '2026-01-01',
    projectCount: 0,
  },
  {
    id: 'admin',
    displayName: 'سارة الإدارية',
    email: 'sara@example.com',
    role: 'admin',
    status: 'suspended',
    lastLoginAt: null,
    createdAt: '2026-01-02',
    projectCount: 2,
  },
  {
    id: 'accountant',
    displayName: 'محمد المحاسب',
    email: 'mohamed@example.com',
    role: 'accountant',
    status: 'active',
    lastLoginAt: null,
    createdAt: '2026-01-03',
    projectCount: 1,
  },
]

const allFilters: UsersFilters = { query: '', role: 'all', status: 'all' }

describe('getUsersViewModel', () => {
  beforeEach(() => {
    vi.mocked(findUsers).mockResolvedValue(users)
  })

  it('builds the users summary from the complete data set', async () => {
    const result = await getUsersViewModel(allFilters)

    expect(result.summary).toEqual({ total: 3, active: 2, admins: 2, suspended: 1 })
  })

  it('searches by name, email, or role without surrounding whitespace', async () => {
    const result = await getUsersViewModel({ ...allFilters, query: '  MOHAMED@  ' })

    expect(result.filteredUsers.map((user) => user.id)).toEqual(['accountant'])
  })

  it('filters by role', async () => {
    const result = await getUsersViewModel({ ...allFilters, role: 'admin' })

    expect(result.filteredUsers.map((user) => user.id)).toEqual(['admin'])
  })

  it('filters by status', async () => {
    const result = await getUsersViewModel({ ...allFilters, status: 'active' })

    expect(result.filteredUsers.map((user) => user.id)).toEqual(['super-admin', 'accountant'])
  })

  it('combines search, role, and status filters', async () => {
    const result = await getUsersViewModel({
      query: 'المدير',
      role: 'super_admin',
      status: 'active',
    })

    expect(result.filteredUsers.map((user) => user.id)).toEqual(['super-admin'])
  })
})

describe('users mutations', () => {
  it('normalizes a valid user before creation', async () => {
    vi.mocked(createUser).mockResolvedValue({ id: 'new-user' })

    await addUser({
      displayName: '  مستخدم جديد  ',
      email: '  USER@EXAMPLE.COM ',
      password: 'password123',
      phone: ' 0100 ',
      role: 'viewer',
    })

    expect(createUser).toHaveBeenCalledWith({
      displayName: 'مستخدم جديد',
      email: 'user@example.com',
      password: 'password123',
      phone: '0100',
      role: 'viewer',
    })
  })

  it('rejects weak temporary passwords', () => {
    expect(() =>
      addUser({ displayName: 'مستخدم', email: 'user@example.com', password: 'short', role: 'viewer' }),
    ).toThrow('8')
  })

  it('delegates account status changes to the repository', async () => {
    vi.mocked(updateUserStatus).mockResolvedValue({ ok: true })

    await setUserStatus('user-id', 'suspended')

    expect(updateUserStatus).toHaveBeenCalledWith('user-id', 'suspended')
  })

  it('deduplicates project assignments', async () => {
    vi.mocked(saveUserProjects).mockResolvedValue({ ok: true })
    await updateUserProjects('user-id', ['one', 'one', 'two'])
    expect(saveUserProjects).toHaveBeenCalledWith('user-id', ['one', 'two'])
  })

  it('rejects weak replacement passwords', () => {
    expect(() => changeTemporaryPassword('user-id', 'short')).toThrow('8')
    expect(setTemporaryPassword).not.toHaveBeenCalled()
  })

  it('derives effective permissions from the role', () => {
    const permissions = getEffectivePermissions('viewer')
    expect(permissions.find((permission) => permission.label === 'عرض المشاريع')?.allowed).toBe(true)
    expect(
      permissions.find((permission) => permission.label === 'إدارة المستخدمين والإعدادات')?.allowed,
    ).toBe(false)
  })
})
