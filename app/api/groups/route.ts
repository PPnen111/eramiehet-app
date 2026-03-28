import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminOrAbove } from '@/lib/auth'

type GroupRow = {
  id: string
  club_id: string
  name: string
  description: string | null
  created_at: string
}

type GroupMemberRow = {
  id: string
  group_id: string
  profile_id: string
  role: string
  profiles: { full_name: string | null; email: string | null } | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('club_id, role, active_club_id')
    .eq('id', user.id)
    .single()

  const p = profile as { club_id: string | null; role: string | null; active_club_id: string | null } | null
  if (!p) return NextResponse.json({ error: 'Profiilia ei löydy' }, { status: 404 })

  const clubId = p.active_club_id ?? p.club_id
  if (!clubId) return NextResponse.json({ error: 'Ei seuraa' }, { status: 400 })

  // Admin/superadmin: see all groups. Leader: see own groups only.
  if (!isAdminOrAbove(p.role)) {
    // Check if user is a group leader
    const { data: leaderGroups } = await admin
      .from('club_group_members')
      .select('group_id')
      .eq('profile_id', user.id)
      .eq('role', 'leader')

    const leaderGroupIds = ((leaderGroups ?? []) as unknown as { group_id: string }[]).map((g) => g.group_id)
    if (leaderGroupIds.length === 0) {
      return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
    }

    const { data: groups } = await admin
      .from('club_groups')
      .select('id, club_id, name, description, created_at')
      .in('id', leaderGroupIds)
      .order('name', { ascending: true })

    const groupRows = (groups ?? []) as unknown as GroupRow[]

    const { data: members } = await admin
      .from('club_group_members')
      .select('id, group_id, profile_id, role, profiles(full_name, email)')
      .in('group_id', leaderGroupIds)
      .order('created_at', { ascending: true })

    const memberRows = (members ?? []) as unknown as GroupMemberRow[]

    const result = groupRows.map((g) => ({
      ...g,
      members: memberRows
        .filter((m) => m.group_id === g.id)
        .map((m) => ({
          id: m.id,
          profile_id: m.profile_id,
          role: m.role,
          full_name: (m.profiles as unknown as { full_name: string | null } | null)?.full_name ?? null,
          email: (m.profiles as unknown as { email: string | null } | null)?.email ?? null,
        })),
    }))

    return NextResponse.json(result)
  }

  // Admin/superadmin: get all club groups
  const { data: groups } = await admin
    .from('club_groups')
    .select('id, club_id, name, description, created_at')
    .eq('club_id', clubId)
    .order('name', { ascending: true })

  const groupRows = (groups ?? []) as unknown as GroupRow[]
  const groupIds = groupRows.map((g) => g.id)

  let memberRows: GroupMemberRow[] = []
  if (groupIds.length > 0) {
    const { data: members } = await admin
      .from('club_group_members')
      .select('id, group_id, profile_id, role, profiles(full_name, email)')
      .in('group_id', groupIds)
      .order('created_at', { ascending: true })

    memberRows = (members ?? []) as unknown as GroupMemberRow[]
  }

  const result = groupRows.map((g) => ({
    ...g,
    members: memberRows
      .filter((m) => m.group_id === g.id)
      .map((m) => ({
        id: m.id,
        profile_id: m.profile_id,
        role: m.role,
        full_name: (m.profiles as unknown as { full_name: string | null } | null)?.full_name ?? null,
        email: (m.profiles as unknown as { email: string | null } | null)?.email ?? null,
      })),
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('club_id, role, active_club_id')
    .eq('id', user.id)
    .single()

  const p = profile as { club_id: string | null; role: string | null; active_club_id: string | null } | null
  if (!isAdminOrAbove(p?.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const clubId = p?.active_club_id ?? p?.club_id
  if (!clubId) return NextResponse.json({ error: 'Ei seuraa' }, { status: 400 })

  const body = await req.json() as unknown
  const { name, description } = body as { name?: string; description?: string }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nimi vaaditaan' }, { status: 400 })
  }

  const { data: created, error } = await admin
    .from('club_groups')
    .insert({ club_id: clubId, name: name.trim(), description: description?.trim() || null, created_by: user.id })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: (created as { id: string }).id })
}
