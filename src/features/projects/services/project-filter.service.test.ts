import { describe, expect, it } from 'vitest'
import type { Project } from '../types/project.types'
import { filterProjects } from './project-filter.service'

const projects: Project[] = [
  {
    id: '1',
    code: 'PRJ-001',
    name: 'هايد بارك',
    client: 'ليجاسي',
    location: 'القاهرة',
    manager: 'أحمد',
    status: 'active',
    progress: 50,
    contractValue: 1,
    received: 1,
    spent: 0,
    startDate: '',
    endDate: '',
    notes: '',
  },
  {
    id: '2',
    code: 'PRJ-002',
    name: 'العيادة',
    client: 'محمد',
    location: 'المعادي',
    manager: 'سارة',
    status: 'paused',
    progress: 20,
    contractValue: 1,
    received: 1,
    spent: 0,
    startDate: '',
    endDate: '',
    notes: '',
  },
]

describe('filterProjects', () => {
  it('searches across project fields', () =>
    expect(filterProjects(projects, 'المعادي', 'all')).toEqual([projects[1]]))
  it('filters status independently', () =>
    expect(filterProjects(projects, '', 'active')).toEqual([projects[0]]))
})
