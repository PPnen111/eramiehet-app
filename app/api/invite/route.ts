import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { invitationHtml, invitationSubject, type InvitationEmailData } from '@/lib/emails/invitation'

const FROM = 'Erämiesten App <noreply@eramiehet.fi>'

type ProfileRow = {
  club_id: string
  role: string
  full_name: string | null
}

type ClubRow = {
  name: string | null
}

export async function POST(req: NextRequest) {
  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || !('email' in body)) {
    return NextResponse.json({ error: 'Sähköposti puuttuu' }, { status: 400 })
  }

  const email = (body as Record<string, unknown>).email
  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Virheellinen sähköpostiosoite' }, { status: 400 })
  }

  // Auth check — user must be admin or board_member
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profileRaw) {
    return NextResponse.json({ error: 'Profiilia ei löydy' }, { status: 403 })
  }

  const profile = profileRaw as unknown as ProfileRow

  if (profile.role !== 'admin' && profile.role !== 'board_member') {
    return NextResponse.json({ error: 'Ei käyttöoikeutta' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Check email is not already a member of this club
  const { data: existingMember } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .eq('club_id', profile.club_id)
    .maybeSingle()

  if (existingMember) {
    return NextResponse.json(
      { error: 'Tämä sähköpostiosoite on jo seuran jäsen' },
      { status: 409 }
    )
  }

  // Check no pending invitation for this email
  const { data: existingInvite } = await admin
    .from('invitations')
    .select('id')
    .eq('email', email)
    .eq('club_id', profile.club_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingInvite) {
    return NextResponse.json(
      { error: 'Kutsu on jo lähetetty tälle sähköpostiosoitteelle' },
      { status: 409 }
    )
  }

  // Create invitation row
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await admin.from('invitations').insert({
    club_id: profile.club_id,
    email,
    token,
    invited_by: user.id,
    status: 'pending',
    expires_at: expiresAt,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Kutsun tallentaminen epäonnistui' }, { status: 500 })
  }

  // Fetch club name
  let clubName = 'Metsästysseura'
  const { data: clubRaw } = await admin
    .from('clubs')
    .select('name')
    .eq('id', profile.club_id)
    .single()

  if (clubRaw) {
    const club = clubRaw as unknown as ClubRow
    if (club.name) clubName = club.name
  }

  // Send invitation email
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Sähköpostipalvelu ei ole käytettävissä' }, { status: 500 })
  }

  const emailData: InvitationEmailData = {
    inviterName: profile.full_name ?? 'Ylläpitäjä',
    clubName,
    token,
  }

  const resend = new Resend(apiKey)
  const { error: sendError } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: invitationSubject(emailData),
    html: invitationHtml(emailData),
  })

  if (sendError) {
    // Roll back the invitation row since email failed
    await admin.from('invitations').delete().eq('token', token)
    return NextResponse.json({ error: 'Sähköpostin lähetys epäonnistui' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
