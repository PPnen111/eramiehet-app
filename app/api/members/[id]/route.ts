import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

type ProfileRow = { club_id: string; active_club_id: string | null; role: string }

async function getCallerClub(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('club_id, active_club_id, role')
    .eq('id', userId)
    .single()
  return data as ProfileRow | null
}

export type MemberDetail = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string
  member_status: string
  join_date: string | null
  member_number: string | null
  birth_date: string | null
  member_type: string | null
  street_address: string | null
  postal_code: string | null
  city: string | null
  home_municipality: string | null
  billing_method: string | null
  additional_info: string | null
  has_logged_in: boolean
  payments: {
    id: string
    description: string | null
    amount_cents: number
    status: string
    due_date: string | null
    paid_at: string | null
  }[]
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const caller = await getCallerClub(supabase, user.id)
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }
  const clubId = caller.active_club_id ?? caller.club_id

  const admin = createAdminClient()

  const { data: profileRaw, error: profileErr } = await admin
    .from('profiles')
    .select(`
      id, full_name, email, phone, role, member_status, join_date,
      member_number, birth_date, member_type, street_address, postal_code,
      city, home_municipality, billing_method, additional_info
    `)
    .eq('id', id)
    .eq('club_id', clubId)
    .single()

  if (profileErr || !profileRaw) {
    return NextResponse.json({ error: 'Jäsentä ei löydy' }, { status: 404 })
  }

  const profile = profileRaw as Omit<MemberDetail, 'has_logged_in' | 'payments'>

  // Login status
  const { data: authUser } = await admin.auth.admin.getUserById(id)
  const has_logged_in = !!authUser?.user?.last_sign_in_at

  // Payments
  const { data: paymentsRaw } = await admin
    .from('payments')
    .select('id, description, amount_cents, status, due_date, paid_at')
    .eq('profile_id', id)
    .eq('club_id', clubId)
    .order('due_date', { ascending: false })

  const payments = (paymentsRaw ?? []) as MemberDetail['payments']

  return NextResponse.json({ member: { ...profile, has_logged_in, payments } })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const caller = await getCallerClub(supabase, user.id)
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }
  const clubId = caller.active_club_id ?? caller.club_id

  const body = (await req.json()) as Partial<{
    full_name: string
    phone: string
    member_number: string
    birth_date: string
    member_type: string
    street_address: string
    postal_code: string
    city: string
    home_municipality: string
    billing_method: string
    additional_info: string
    role: string
    member_status: string
    join_date: string
  }>

  // Cannot change own role
  if (id === user.id && body.role !== undefined) {
    return NextResponse.json({ error: 'Et voi muuttaa omaa rooliasi' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update(body)
    .eq('id', id)
    .eq('club_id', clubId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  // Cannot delete yourself
  if (id === user.id) {
    return NextResponse.json({ error: 'Et voi poistaa itseäsi' }, { status: 403 })
  }

  const caller = await getCallerClub(supabase, user.id)
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }
  const clubId = caller.active_club_id ?? caller.club_id

  const admin = createAdminClient()

  // Check that member belongs to this club before deleting
  const { data: target } = await admin
    .from('profiles')
    .select('id, email')
    .eq('id', id)
    .eq('club_id', clubId)
    .single()

  if (!target) {
    return NextResponse.json({ error: 'Jäsentä ei löydy' }, { status: 404 })
  }

  // Delete profile
  const { error } = await admin
    .from('profiles')
    .delete()
    .eq('id', id)
    .eq('club_id', clubId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Delete auth user (ignore errors — member may not have an auth account)
  await admin.auth.admin.deleteUser(id).catch(() => {})

  return NextResponse.json({ ok: true })
}
