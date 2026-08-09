import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
}

type UserRole = 'super_admin' | 'admin' | 'accountant' | 'viewer'
type UserStatus = 'active' | 'suspended'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isRole(value: unknown): value is UserRole {
  return ['super_admin', 'admin', 'accountant', 'viewer'].includes(String(value))
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authorization = request.headers.get('Authorization')
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization)
    return json({ error: 'Unauthorized' }, 401)

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data: callerData, error: callerError } = await callerClient.auth.getUser()
  const caller = callerData.user
  const callerRole = caller?.app_metadata.role
  if (callerError || !caller || !['admin', 'super_admin'].includes(callerRole)) {
    return json({ error: 'Administrator access required' }, 403)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  try {
    if (request.method === 'GET') {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (error) throw error
      return json(
        data.users.map((user) => ({
          id: user.id,
          displayName: String(user.user_metadata.full_name ?? user.email ?? ''),
          email: user.email ?? '',
          role: isRole(user.app_metadata.role) ? user.app_metadata.role : 'viewer',
          status: user.banned_until && new Date(user.banned_until) > new Date() ? 'suspended' : 'active',
          lastLoginAt: user.last_sign_in_at ?? null,
          createdAt: user.created_at,
          projectCount: 0,
          phone: typeof user.user_metadata.phone === 'string' ? user.user_metadata.phone : undefined,
        })),
      )
    }

    const payload = await request.json()
    if (request.method === 'POST') {
      if (!payload.email || !payload.password || !payload.displayName || !isRole(payload.role)) {
        return json({ error: 'Invalid user data' }, 400)
      }
      if (payload.role === 'super_admin' && callerRole !== 'super_admin') {
        return json({ error: 'Only a super administrator can grant this role' }, 403)
      }
      const { data, error } = await admin.auth.admin.createUser({
        email: String(payload.email).trim().toLowerCase(),
        password: String(payload.password),
        email_confirm: true,
        app_metadata: { role: payload.role },
        user_metadata: { full_name: String(payload.displayName).trim(), phone: payload.phone || null },
      })
      if (error) throw error
      return json({ id: data.user.id }, 201)
    }

    if (request.method === 'PATCH' && payload.id) {
      const { data: targetData, error: targetError } = await admin.auth.admin.getUserById(payload.id)
      if (targetError) throw targetError
      if (targetData.user.app_metadata.role === 'super_admin' && callerRole !== 'super_admin') {
        return json({ error: 'Only a super administrator can modify this account' }, 403)
      }
      const attributes: Record<string, unknown> = {}
      if (payload.displayName !== undefined || payload.phone !== undefined) {
        attributes.user_metadata = {
          full_name: String(payload.displayName ?? '').trim(),
          phone: payload.phone || null,
        }
      }
      if (payload.role !== undefined) {
        if (!isRole(payload.role)) return json({ error: 'Invalid role' }, 400)
        if (payload.id === caller.id && payload.role !== callerRole) {
          return json({ error: 'You cannot change your own role' }, 400)
        }
        if (payload.role === 'super_admin' && callerRole !== 'super_admin') {
          return json({ error: 'Only a super administrator can grant this role' }, 403)
        }
        attributes.app_metadata = { role: payload.role }
      }
      if (payload.status !== undefined) {
        const status = payload.status as UserStatus
        if (!['active', 'suspended'].includes(status)) return json({ error: 'Invalid status' }, 400)
        if (payload.id === caller.id && status === 'suspended') {
          return json({ error: 'You cannot suspend your own account' }, 400)
        }
        attributes.ban_duration = status === 'suspended' ? '876000h' : 'none'
      }
      const { error } = await admin.auth.admin.updateUserById(payload.id, attributes)
      if (error) throw error
      return json({ ok: true })
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 400)
  }
})
