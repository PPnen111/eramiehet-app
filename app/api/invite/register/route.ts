import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type InvitationRow = {
  id: string
  email: string
  club_id: string
  status: string
  expires_at: string
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  const { token, full_name, password } = body as Record<string, unknown>

  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'Token puuttuu' }, { status: 400 })
  }
  if (typeof full_name !== 'string' || !full_name.trim()) {
    return NextResponse.json({ error: 'Nimi puuttuu' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Salasana on liian lyhyt' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Validate invitation
  const { data: raw } = await admin
    .from('invitations')
    .select('id, email, club_id, status, expires_at')
    .eq('token', token)
    .single()

  if (!raw) {
    return NextResponse.json({ error: 'Kutsu ei löydy' }, { status: 404 })
  }

  const invitation = raw as unknown as InvitationRow

  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Kutsu on jo käytetty tai peruutettu' }, { status: 409 })
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Kutsu on vanhentunut' }, { status: 410 })
  }

  // Create auth user via admin (email already confirmed, no confirmation email needed)
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
  })

  if (createError) {
    if (createError.message.toLowerCase().includes('already registered')) {
      return NextResponse.json(
        { error: 'Tämä sähköpostiosoite on jo rekisteröity. Kirjaudu sisään.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Tilin luominen epäonnistui: ' + createError.message }, { status: 500 })
  }

  if (!newUser.user) {
    return NextResponse.json({ error: 'Tilin luominen epäonnistui' }, { status: 500 })
  }

  // Create profile row directly (don't rely on trigger)
  const { error: profileError } = await admin.from('profiles').upsert({
    id: newUser.user.id,
    club_id: invitation.club_id,
    email: invitation.email,
    full_name: full_name.trim(),
    role: 'member',
    member_status: 'active',
    join_date: new Date().toISOString().split('T')[0],
  })

  if (profileError) {
    // Roll back auth user
    await admin.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: 'Profiilin luominen epäonnistui' }, { status: 500 })
  }

  // Mark invitation as accepted
  await admin.from('invitations').update({ status: 'accepted' }).eq('id', invitation.id)

  return NextResponse.json({ ok: true })
}
