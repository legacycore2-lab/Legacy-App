import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findProjectById, insertProject, updateProject } from '../repositories/projects.repository'
import { buildProjectCreatePreview, saveProject, validateProjectCreateInput } from './project-create.service'
import type { ProjectCreateInput } from '../types/project-create.types'

vi.mock('../repositories/projects.repository', () => ({
  findProjectById: vi.fn(),
  insertProject: vi.fn(),
  updateProject: vi.fn(),
}))

const validInput: ProjectCreateInput = {
  name: 'مشروع تجريبي',
  code: 'PRJ-001',
  client: 'عميل تجريبي',
  location: 'القاهرة',
  manager: 'مدير المشروع',
  status: 'active',
  contractValue: '1250000',
  startDate: '2026-07-21',
  endDate: '2026-12-31',
  notes: 'ملاحظات',
}

const editableRecord = {
  id: 'project-id',
  name: validInput.name,
  code: validInput.code,
  client_name: validInput.client,
  location: validInput.location,
  manager: validInput.manager,
  status: validInput.status,
  progress: 0,
  contract_value: 1_250_000,
  received: 0,
  spent: 0,
  start_date: validInput.startDate,
  end_date: validInput.endDate,
  notes: validInput.notes,
  is_archived: false,
}

describe('project creation service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds a normalized preview for valid input', () => {
    expect(buildProjectCreatePreview(validInput)).toEqual({
      ...validInput,
      contractValue: 1_250_000,
    })
  })

  it('rejects an end date before the start date', () => {
    const errors = validateProjectCreateInput({
      ...validInput,
      endDate: '2026-07-20',
    })

    expect(errors).toContain('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.')
  })

  it('rejects negative contract values', () => {
    const errors = validateProjectCreateInput({
      ...validInput,
      contractValue: '-1',
    })

    expect(errors).toContain('قيمة التعاقد غير صحيحة.')
  })

  it('updates the existing project when an identifier is provided', async () => {
    vi.mocked(findProjectById).mockResolvedValue(editableRecord)
    vi.mocked(updateProject).mockResolvedValue(editableRecord)

    await expect(saveProject(validInput, 'project-id')).resolves.toMatchObject({ id: 'project-id' })
    expect(findProjectById).toHaveBeenCalledWith('project-id')
    expect(updateProject).toHaveBeenCalledWith(
      'project-id',
      expect.objectContaining({ name: validInput.name }),
    )
    expect(insertProject).not.toHaveBeenCalled()
  })

  it('blocks updates to archived projects before writing', async () => {
    vi.mocked(findProjectById).mockResolvedValue({
      ...editableRecord,
      status: 'archived',
      is_archived: true,
    })

    await expect(saveProject(validInput, 'project-id')).rejects.toThrow('لا يمكن تعديل مشروع مؤرشف')
    expect(updateProject).not.toHaveBeenCalled()
  })

  it('rejects updates when the project no longer exists', async () => {
    vi.mocked(findProjectById).mockResolvedValue(null)

    await expect(saveProject(validInput, 'project-id')).rejects.toThrow('المشروع غير موجود')
    expect(updateProject).not.toHaveBeenCalled()
  })
})
