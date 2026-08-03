import { createContext } from 'react'

export type CurrentUser = {
  displayName: string
  role: 'super_admin' | 'admin' | 'accountant' | 'viewer'
}

export const CurrentUserContext = createContext<CurrentUser | null>(null)
