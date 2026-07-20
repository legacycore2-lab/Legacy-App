import type { Project, ProjectStatusFilter } from '../types/project.types'

export function filterProjects(projects: Project[], query: string, status: ProjectStatusFilter): Project[] {
  const value = query.trim().toLocaleLowerCase('ar')
  return projects.filter((project) => {
    const matchesStatus = status === 'all' || project.status === status
    const matchesQuery =
      !value ||
      [project.name, project.client, project.location, project.manager].some((field) =>
        field.toLocaleLowerCase('ar').includes(value),
      )
    return matchesStatus && matchesQuery
  })
}
