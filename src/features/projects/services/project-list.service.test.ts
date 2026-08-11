import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findProjectFinancialEntries, findProjectsPage } from '../repositories/projects.repository'
import { getProjectsPage } from './project-list.service'

vi.mock('../repositories/projects.repository', () => ({
  findProjectFinancialEntries: vi.fn(),
  findProjectsPage: vi.fn(),
}))

const record = {
  id: 'project-1',
  name: 'Project 1',
  code: 'P-001',
  client_name: 'Client',
  location: 'Cairo',
  manager: 'Manager',
  status: 'active',
  progress: 25,
  contract_value: 1000,
  received: 0,
  spent: 0,
  start_date: '2026-01-01',
  end_date: null,
  notes: null,
  is_archived: false,
}

describe('project list service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findProjectFinancialEntries).mockResolvedValue([])
  })

  it('passes pagination and filters to the repository', async () => {
    vi.mocked(findProjectsPage).mockResolvedValue({ records: [record], totalCount: 60 })

    const result = await getProjectsPage({
      page: 2,
      pageSize: 25,
      query: 'Project',
      status: 'active',
    })

    expect(findProjectsPage).toHaveBeenCalledWith({
      offset: 25,
      limit: 25,
      query: 'Project',
      status: 'active',
    })
    expect(result.page).toBe(2)
    expect(result.totalPages).toBe(3)
  })

  it('loads financial entries only for projects on the visible page', async () => {
    vi.mocked(findProjectsPage).mockResolvedValue({ records: [record], totalCount: 1 })

    await getProjectsPage({ page: 1, pageSize: 25, query: '', status: 'all' })

    expect(findProjectFinancialEntries).toHaveBeenCalledWith(['project-1'])
  })

  it('clamps an out-of-range page and refetches the valid page', async () => {
    vi.mocked(findProjectsPage)
      .mockResolvedValueOnce({ records: [], totalCount: 30 })
      .mockResolvedValueOnce({ records: [record], totalCount: 30 })

    const result = await getProjectsPage({ page: 9, pageSize: 25, query: '', status: 'all' })

    expect(findProjectsPage).toHaveBeenNthCalledWith(1, {
      offset: 200,
      limit: 25,
      query: '',
      status: 'all',
    })
    expect(findProjectsPage).toHaveBeenNthCalledWith(2, {
      offset: 25,
      limit: 25,
      query: '',
      status: 'all',
    })
    expect(result.page).toBe(2)
  })
})
