import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '../../../lib/supabase/client'
import type { LoginCredentials } from '../types/auth.types'

export const authRepository = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await getSupabaseClient().auth.getSession()
    if (error) throw error
    return data.session
  },

  subscribe(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void {
    const { data } = getSupabaseClient().auth.onAuthStateChange(callback)
    return () => data.subscription.unsubscribe()
  },

  async signIn(credentials: LoginCredentials): Promise<Session> {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword(credentials)
    if (error) throw error
    if (!data.session) throw new Error('Supabase did not create a session.')
    return data.session
  },

  async signOut(): Promise<void> {
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) throw error
  },
}
