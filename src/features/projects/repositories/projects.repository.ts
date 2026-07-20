import { projectsMock } from '../data/projects.mock'
import type { Project } from '../types/project.types'

export async function findProjects(): Promise<Project[]> {
  return projectsMock
}
