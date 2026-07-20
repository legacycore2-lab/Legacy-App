import { describe, expect, it } from 'vitest'
import type { Project } from '../types/project.types'
import { buildProjectRows, summarizeProjects } from './projects.service'

const projects: Project[] = [
  {
    id: 'one',
    name: 'الأول',
    client: 'عميل',
    location: 'القاهرة',
    manager: 'مدير',
    status: 'active',
    progress: 50,
    contractValue: 1000,
    received: 700,
    spent: 250,
    startDate: '',
    endDate: '',
  },
  {
    id: 'two',
    name: 'الثاني',
    client: 'عميل',
    location: 'الجيزة',
    manager: 'مدير',
    status: 'completed',
    progress: 100,
    contractValue: 500,
    received: 500,
    spent: 400,
    startDate: '',
    endDate: '',
  },
]

describe('projects service view models', () => {
  it('calculates portfolio totals outside the component layer', () => {
    expect(summarizeProjects(projects)).toEqual({
      total: 2,
      active: 1,
      completed: 1,
      paused: 0,
      totalContracts: 1500,
      totalLiquidity: 550,
    })
  })

  it('prepares balances for the table view', () => {
    expect(buildProjectRows(projects).map(({ balance }) => balance)).toEqual([450, 100])
  })
})
