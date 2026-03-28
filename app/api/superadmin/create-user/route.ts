import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const body = await request.json() as unknown
  const { email, password, full_name, club_id, role } = body as {
    email?: string
    password?: string
    full_name?: string
    club_id?: string
    role?: string
  }

  if (!email || !password || !full_name || !club_id || !role) {
    return NextResponse.json({ error: 'Puuttuvia kenttiä' }, { status: 400 })
  }

  const validRoles = ['member', 'board_member', 'admin']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Virheellinen rooli' }, { status: 400 })
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, club_id },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const userId = authData.user.id

  // 2. Insert profile
  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    full_name,
    email,
    club_id,
    active_club_id: club_id,
    role,
    member_status: 'active',
  })

  if (profileError) {
    // Rollback auth user
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Profiilin luonti epäonnistui: ' + profileError.message }, { status: 500 })
  }

  // 3. Insert club_members (non-fatal)
  await admin.from('club_members').insert({
    club_id,
    profile_id: userId,
    role,
    status: 'active',
  })

  return NextResponse.json({ ok: true, userId })
}
