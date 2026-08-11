import { describe, expect, it, vi } from 'vitest'
import { getDashboardData } from './dashboard.service'

vi.mock('../repositories/dashboard.repository', () => ({
  findDashboardData: vi.fn().mockResolvedValue({
    projects: [
      {
        id: 'p1',
        name: 'هايد بارك',
        client_name: 'شركة ليجاسي',
        status: 'active',
        progress: 74,
        is_archived: false,
      },
      {
        id: 'p2',
        name: 'مشروع متوقف',
        client_name: null,
        status: 'paused',
        progress: 30,
        is_archived: false,
      },
      {
        id: 'p3',
        name: 'مشروع مؤرشف',
        client_name: 'عميل',
        status: 'active',
        progress: 100,
        is_archived: true,
      },
    ],
    financialEntries: [
      { seq: 1, project_id: 'p1', amount: '10000', type: 'income' },
      { seq: 2, project_id: 'p1', amount: '3000', type: 'expense' },
      { seq: 3, project_id: null, amount: '500', type: 'expense' },
    ],
    recentEntries: [
      {
        id: 'e3',
        seq: 3,
        project_id: null,
        description: 'قيد عام',
        entry_date: '2026-07-23',
        amount: '500',
        type: 'expense',
      },
      {
        id: 'e2',
        seq: 2,
        project_id: 'p1',
        description: 'مصروف',
        entry_date: '2026-07-24',
        amount: '3000',
        type: 'expense',
      },
      {
        id: 'e1',
        seq: 1,
        project_id: 'p1',
        description: 'دفعة',
        entry_date: '2026-07-25',
        amount: '10000',
        type: 'income',
      },
    ],
  }),
  subscribeToDashboardChanges: vi.fn().mockReturnValue(() => {}),
}))

describe('getDashboardData', () => {
  it('calculates correct balance from financial rows', async () => {
    const data = await getDashboardData()
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
    expect(data.kpis[3].value).toBe('1')
  })

  it('excludes archived projects from the projects list', async () => {
    const data = await getDashboardData()
    expect(data.projects.map((project) => project.name)).not.toContain('مشروع مؤرشف')
  })

  it('preserves the project client display', async () => {
    const data = await getDashboardData()
    expect(data.projects.find((project) => project.name === 'هايد بارك')?.client).toBe('شركة ليجاسي')
  })

  it('limits projects list to 3 items', async () => {
    const data = await getDashboardData()
    expect(data.projects.length).toBeLessThanOrEqual(3)
  })

  it('uses only recent-entry payload for the recent entries widget', async () => {
    const data = await getDashboardData()
    expect(data.entries).toHaveLength(3)
    expect(data.entries[0]).toMatchObject({ id: '#3', project: 'بدون مشروع', description: 'قيد عام' })
  })

  it('keeps total entry count based on all financial rows', async () => {
    const data = await getDashboardData()
    expect(data.kpis[0].trend).toBe('3 قيد')
  })

  it('returns dashboardActions', async () => {
    const data = await getDashboardData()
    expect(data.actions.length).toBeGreaterThan(0)
  })
})
