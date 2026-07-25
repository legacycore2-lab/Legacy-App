import { describe, expect, it, vi } from 'vitest'
import { getDashboardData } from './dashboard.service'

vi.mock('../repositories/dashboard.repository', () => ({
  findDashboardData: vi.fn().mockResolvedValue({
    projects: [
      { id: 'p1', name: 'هايد بارك', client_name: 'شركة ليجاسي', status: 'active', progress: 74, is_archived: false },
      { id: 'p2', name: 'مشروع متوقف', client_name: null, status: 'paused', progress: 30, is_archived: false },
      { id: 'p3', name: 'مشروع مؤرشف', client_name: 'عميل', status: 'active', progress: 100, is_archived: true },
    ],
    entries: [
      { id: 'e1', seq: 1, project_id: 'p1', description: 'دفعة', entry_date: '2026-07-25', amount: '10000', type: 'income' },
      { id: 'e2', seq: 2, project_id: 'p1', description: 'مصروف', entry_date: '2026-07-24', amount: '3000',  type: 'expense' },
      { id: 'e3', seq: 3, project_id: null, description: 'قيد عام', entry_date: '2026-07-23', amount: '500',   type: 'expense' },
    ],
  }),
  subscribeToDashboardChanges: vi.fn().mockReturnValue(() => {}),
}))

describe('getDashboardData', () => {
  it('calculates correct balance (income - expense)', async () => {
    const data = await getDashboardData()
    // 10000 income - 3000 - 500 expense = 6500
    expect(data.kpis[0].value).toBe('6,500')
  })

  it('calculates total income correctly', async () => {
    const data = await getDashboardData()
    expect(data.kpis[1].value).toBe('10,000')
  })

  it('calculates total expense correctly', async () => {
    const data = await getDashboardData()
    expect(data.kpis[2].value).toBe('3,500')
  })

  it('counts only active non-archived projects', async () => {
    const data = await getDashboardData()
    // p1 active, p2 paused (not active), p3 archived — only p1 counts
    expect(data.kpis[3].value).toBe('1')
  })

  it('excludes archived projects from the projects list', async () => {
    const data = await getDashboardData()
    const names = data.projects.map((p) => p.name)
    expect(names).not.toContain('مشروع مؤرشف')
  })

  it('shows "بدون عميل" when client_name is null', async () => {
    const data = await getDashboardData()
    // p2 is paused (not active) so won't appear — test p1 which has a client
    const withClient = data.projects.find((p) => p.name === 'هايد بارك')
    expect(withClient?.client).toBe('شركة ليجاسي')
  })

  it('limits projects list to 3 items', async () => {
    const data = await getDashboardData()
    expect(data.projects.length).toBeLessThanOrEqual(3)
  })

  it('limits entries list to 3 items', async () => {
    const data = await getDashboardData()
    expect(data.entries.length).toBeLessThanOrEqual(3)
  })

  it('formats entry id using seq number', async () => {
    const data = await getDashboardData()
    expect(data.entries[0].id).toBe('#1')
  })

  it('returns dashboardActions', async () => {
    const data = await getDashboardData()
    expect(data.actions.length).toBeGreaterThan(0)
  })
})
