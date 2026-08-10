import { AppError, DataValidationError } from '../../../shared/errors/app-error'
import { countProjectDeleteDependencies, deleteProjectById } from '../repositories/projects.repository'

export async function deleteProject(projectId: string): Promise<void> {
  const normalizedProjectId = projectId.trim()
  if (!normalizedProjectId) throw new DataValidationError('معرّف المشروع غير صالح.')

  const dependencies = await countProjectDeleteDependencies(normalizedProjectId)
  const dependencyCount = Object.values(dependencies).reduce((total, count) => total + count, 0)

  if (dependencyCount > 0) {
    throw new AppError(
      'لا يمكن حذف المشروع لأنه مرتبط بقيود أو حركات مالية أو عهد. يمكنك أرشفته بدلًا من ذلك.',
      'PROJECT_HAS_FINANCIAL_ACTIVITY',
    )
  }

  await deleteProjectById(normalizedProjectId)
}
