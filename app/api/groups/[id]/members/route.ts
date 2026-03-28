import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminOrAbove, isBoardOrAbove } from '@/lib/auth'

async function canManageGroup(userId: string, groupId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const role = (profile as { role: string } | null)?.role
  if (isBoardOrAbove(role)) return true

  // Check if user is leader of this group
  const { data: membership } = await admin
    .from('club_group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('profile_id', userId)
    .single()

  return (membership as { role: string } | null)?.role === 'leader'
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await canManageGroup(user.id, groupId, admin))) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const body = await req.json() as unknown
  const { profile_id } = body as { profile_id?: string }
  if (!profile_id) return NextResponse.json({ error: 'profile_id vaaditaan' }, { status: 400 })

  const { error } = await admin
    .from('club_group_members')
    .insert({ group_id: groupId, profile_id, role: 'member' })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Jäsen on jo ryhmässä' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await canManageGroup(user.id, groupId, admin))) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const body = await req.json() as unknown
  const { membership_id } = body as { membership_id?: string }
  if (!membership_id) return NextResponse.json({ error: 'membership_id vaaditaan' }, { status: 400 })

  const { error } = await admin
    .from('club_group_members')
    .delete()
    .eq('id', membership_id)
    .eq('group_id', groupId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()

  // Only admin/superadmin can change member roles
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isBoardOrAbove((profile as { role: string } | null)?.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const body = await req.json() as unknown
  const { membership_id, role } = body as { membership_id?: string; role?: string }

  if (!membership_id || !role) {
    return NextResponse.json({ error: 'membership_id ja role vaaditaan' }, { status: 400 })
  }

  if (role !== 'leader' && role !== 'member') {
    return NextResponse.json({ error: 'Virheellinen rooli' }, { status: 400 })
  }

  const { error } = await admin
    .from('club_group_members')
    .update({ role })
    .eq('id', membership_id)
    .eq('group_id', groupId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
