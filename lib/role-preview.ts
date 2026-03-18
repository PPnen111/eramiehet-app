import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_ROLES = ['admin', 'board_member', 'member'] as const
const COOKIE_NAME = 'preview_role'

async function isSuperadmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return (data as { role: string } | null)?.role === 'superadmin'
}

/** Returns the active preview role, or null if not in preview mode. */
export async function getPreviewRole(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw || !ALLOWED_ROLES.includes(raw as (typeof ALLOWED_ROLES)[number])) return null

  // Only honour the cookie for real superadmins
  const ok = await isSuperadmin()
  return ok ? raw : null
}

/**
 * Returns the role that should govern UI and access decisions.
 * When a superadmin is previewing, this is the preview role; otherwise
 * it is the user's actual role.
 */
export async function getEffectiveRole(actualRole: string): Promise<string> {
  if (actualRole !== 'superadmin') return actualRole
  const preview = await getPreviewRole()
  return preview ?? actualRole
}
