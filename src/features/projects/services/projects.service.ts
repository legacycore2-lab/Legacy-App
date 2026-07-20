import { findProjects } from '../repositories/projects.repository'
import type { Project } from '../types/project.types'

export function getProjects(): Promise<Project[]> {
  return findProjects()
}
