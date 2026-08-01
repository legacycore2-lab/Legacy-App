import { AppError, DataValidationError } from '../../../shared/errors/app-error'
import { countProjectEntries, deleteProjectById } from '../repositories/projects.repository'

export async function deleteProject(projectId: string): Promise<void> {
  const normalizedProjectId = projectId.trim()
  if (!normalizedProjectId) throw new DataValidationError('معرّف المشروع غير صالح.')

  const entryCount = await countProjectEntries(normalizedProjectId)
  if (entryCount > 0) {
    throw new AppError(
      'لا يمكن حذف المشروع لأنه مرتبط بقيود أو حركات مالية. يمكنك أرشفته بدلًا من ذلك.',
      'PROJECT_HAS_FINANCIAL_ACTIVITY',
    )
  }

  await deleteProjectById(normalizedProjectId)
}
