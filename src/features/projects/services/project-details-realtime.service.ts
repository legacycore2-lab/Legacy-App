import { subscribeToProjectDetailChanges } from '../repositories/projects.repository'

export function watchProjectDetails(onChange: () => void): () => void {
  return subscribeToProjectDetailChanges(onChange)
}
