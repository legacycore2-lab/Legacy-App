import { insertProject } from '../repositories/projects.repository'
import type { Project } from '../types/project.types'
import type { ProjectCreateInput, ProjectCreatePreview } from '../types/project-create.types'
import { mapProject, mapProjectCreateToRecord } from './project.mapper'

export function validateProjectCreateInput(input: ProjectCreateInput): string[] {
  const errors: string[] = []
  const contractValue = Number(input.contractValue)

  if (!input.name.trim()) errors.push('اسم المشروع مطلوب.')
  if (!input.client.trim()) errors.push('اسم العميل مطلوب.')
  if (!input.startDate) errors.push('تاريخ البداية مطلوب.')
  if (input.endDate && input.startDate && input.endDate < input.startDate) {
    errors.push('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.')
  }
  if (input.contractValue && (!Number.isFinite(contractValue) || contractValue < 0)) {
    errors.push('قيمة التعاقد غير صحيحة.')
  }

  return errors
}

export function buildProjectCreatePreview(input: ProjectCreateInput): ProjectCreatePreview | null {
  if (validateProjectCreateInput(input).length > 0) return null

  return {
    name: input.name.trim(),
    code: input.code.trim(),
    client: input.client.trim(),
    location: input.location.trim(),
    manager: input.manager.trim(),
    status: input.status,
    contractValue: Number(input.contractValue) || 0,
    startDate: input.startDate,
    endDate: input.endDate,
    notes: input.notes.trim(),
  }
}

export async function createProject(input: ProjectCreateInput): Promise<Project> {
  const preview = buildProjectCreatePreview(input)
  if (!preview) {
    throw new Error(validateProjectCreateInput(input)[0] ?? 'بيانات المشروع غير صالحة.')
  }

  const record = await insertProject(mapProjectCreateToRecord(preview))
  return mapProject(record)
}
