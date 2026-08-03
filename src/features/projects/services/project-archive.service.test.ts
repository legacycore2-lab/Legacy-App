import { beforeEach, describe, expect, it, vi } from 'vitest'
import { archiveProjectById } from '../repositories/projects.repository'
import { archiveProject } from './project-archive.service'

vi.mock('../repositories/projects.repository', () => ({ archiveProjectById: vi.fn() }))

describe('project archive service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a blank project identifier', async () => {
    await expect(archiveProject('  ')).rejects.toThrow('معرّف المشروع غير صالح')
    expect(archiveProjectById).not.toHaveBeenCalled()
  })

  it('archives the project without touching its financial history', async () => {
    vi.mocked(archiveProjectById).mockResolvedValue({
      id: 'project-1',
      name: 'تاج سلطان',
      status: 'archived',
      is_archived: true,
    })

    await expect(archiveProject(' project-1 ')).resolves.toMatchObject({
      id: 'project-1',
      status: 'archived',
    })
    expect(archiveProjectById).toHaveBeenCalledWith('project-1')
  })
})
