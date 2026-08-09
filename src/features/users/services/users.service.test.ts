import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findUsers } from '../repositories/users.repository'
import type { ManagedUser, UsersFilters } from '../types/users.types'
import { getUsersViewModel } from './users.service'

vi.mock('../repositories/users.repository', () => ({
  findUsers: vi.fn(),
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
