import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '../../../lib/supabase/client'
import { supabaseAuthStorage } from '../../../lib/supabase/auth-storage'
import type { AuthIdentity, LoginCredentials } from '../types/auth.types'

function toIdentity(session: Session | null): AuthIdentity | null {
  if (!session) return null

  const fullName = session.user.user_metadata.full_name
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    fullName: typeof fullName === 'string' && fullName.trim() ? fullName.trim() : null,
    role: session.user.app_metadata.role,
  }
}

export const authRepository = {
  async getIdentity(): Promise<AuthIdentity | null> {
    const { data, error } = await getSupabaseClient().auth.getSession()
    if (error) throw error
    return toIdentity(data.session)
  },

  subscribe(callback: (identity: AuthIdentity | null) => void): () => void {
    const { data } = getSupabaseClient().auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => callback(toIdentity(session)),
    )
    return () => data.subscription.unsubscribe()
  },

  async signIn(credentials: LoginCredentials): Promise<AuthIdentity> {
    supabaseAuthStorage.setPersistence(credentials.remember ? 'persistent' : 'session')
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })
    if (error) throw error
    if (!data.session) throw new Error('Supabase did not create a session.')
    return toIdentity(data.session)!
  },

  async signOut(): Promise<void> {
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) throw error
  },
}
