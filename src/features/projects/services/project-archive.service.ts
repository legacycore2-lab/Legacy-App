import { DataValidationError } from '../../../shared/errors/app-error'
import { archiveProjectById } from '../repositories/projects.repository'
import { mapProject } from './project.mapper'

export async function archiveProject(projectId: string) {
  const normalizedProjectId = projectId.trim()
  if (!normalizedProjectId) throw new DataValidationError('معرّف المشروع غير صالح.')
  return mapProject(await archiveProjectById(normalizedProjectId))
}
