import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  countProjectDeleteDependencies,
  deleteProjectById,
} from '../repositories/projects.repository'
import { deleteProject } from './project-delete.service'

vi.mock('../repositories/projects.repository', () => ({
  countProjectDeleteDependencies: vi.fn(),
  deleteProjectById: vi.fn(),
}))

const noDependencies = {
  entries: 0,
  journals: 0,
  journalLines: 0,
  advanceProjects: 0,
  advanceTransactions: 0,
}

describe('project delete service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a project when it has no financial dependencies', async () => {
    vi.mocked(countProjectDeleteDependencies).mockResolvedValue(noDependencies)
    vi.mocked(deleteProjectById).mockResolvedValue()

    await expect(deleteProject(' project-id ')).resolves.toBeUndefined()

    expect(countProjectDeleteDependencies).toHaveBeenCalledWith('project-id')
    expect(deleteProjectById).toHaveBeenCalledWith('project-id')
  })

  it.each([
    ['entries', { entries: 1 }],
    ['journals', { journals: 1 }],
    ['journal lines', { journalLines: 1 }],
    ['advance projects', { advanceProjects: 1 }],
    ['advance transactions', { advanceTransactions: 1 }],
  ])('blocks deletion when %s exist', async (_label, override) => {
    vi.mocked(countProjectDeleteDependencies).mockResolvedValue({
      ...noDependencies,
      ...override,
    })

    await expect(deleteProject('project-id')).rejects.toMatchObject({
      code: 'PROJECT_HAS_FINANCIAL_ACTIVITY',
    })

    expect(deleteProjectById).not.toHaveBeenCalled()
  })

  it('rejects an empty project identifier before querying the repository', async () => {
    await expect(deleteProject('   ')).rejects.toThrow('معرّف المشروع غير صالح.')

    expect(countProjectDeleteDependencies).not.toHaveBeenCalled()
    expect(deleteProjectById).not.toHaveBeenCalled()
  })
})
