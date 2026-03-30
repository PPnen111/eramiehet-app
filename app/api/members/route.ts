import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

export type MemberWithStatus = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string
  member_status: string
  member_type: string | null
  has_logged_in: boolean
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, role, active_club_id')
    .eq('id', user.id)
    .single()

  const caller = profileRaw as {
    club_id: string
    role: string
    active_club_id: string | null
  } | null
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }
  const clubId = caller.active_club_id ?? caller.club_id

  const admin = createAdminClient()

  // Fetch all profiles for the club
  const { data: profilesRaw } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, role, member_status, member_type')
    .eq('club_id', clubId)
    .order('full_name', { ascending: true })

  const profiles = (profilesRaw ?? []) as {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    role: string
    member_status: string
    member_type: string | null
  }[]

  if (profiles.length === 0) {
    return NextResponse.json({ members: [] })
  }

  // Fetch auth users to get login status
  // listUsers returns all users; we match by ID against our profiles
  const profileIds = new Set(profiles.map((p) => p.id))
  const loginMap = new Map<string, boolean>()

  let page = 1
  const perPage = 1000
  while (true) {
    const { data: authData } = await admin.auth.admin.listUsers({ page, perPage })
    if (!authData?.users?.length) break
    for (const u of authData.users) {
      if (profileIds.has(u.id)) {
        loginMap.set(u.id, !!u.last_sign_in_at)
      }
    }
    if (authData.users.length < perPage) break
    page++
  }

  const members: MemberWithStatus[] = profiles.map((p) => ({
    ...p,
    has_logged_in: loginMap.get(p.id) ?? false,
  }))

  return NextResponse.json({ members })
}
