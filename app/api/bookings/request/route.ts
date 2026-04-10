import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { guardTenant } from '@/lib/tenant'

const LOCATION_LABELS: Record<string, string> = {
  erakartano: 'Eräkartano',
  takkatupa: 'Takkatupa',
  sauna: 'Sauna',
  nylkyvaja: 'Nylkyvaja',
  majoitustilat: 'Majoitustilat',
}

const FROM = 'JahtiPro <noreply@jahtipro.fi>'

type ProfileRow = { club_id: string; full_name: string | null }

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const location = typeof b.location === 'string' ? b.location : ''
  const starts_on = typeof b.starts_on === 'string' ? b.starts_on : ''
  const ends_on = typeof b.ends_on === 'string' ? b.ends_on : ''
  const booker_name = typeof b.booker_name === 'string' && b.booker_name ? b.booker_name : null
  const note = typeof b.note === 'string' && b.note ? b.note : null

  if (!location || !starts_on || !ends_on) {
    return NextResponse.json({ error: 'Pakolliset kentät puuttuvat' }, { status: 400 })
  }
  if (!LOCATION_LABELS[location]) {
    return NextResponse.json({ error: 'Tuntematon kohde' }, { status: 400 })
  }
  if (ends_on < starts_on) {
    return NextResponse.json({ error: 'Loppupäivä ei voi olla ennen alkupäivää' }, { status: 400 })
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, full_name')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as ProfileRow | null
  if (!profile?.club_id) {
    return NextResponse.json({ error: 'Profiilia ei löydy' }, { status: 400 })
  }
  const brv = await guardTenant({ id: user.id, role: 'member', club_id: profile.club_id, active_club_id: null }, profile.club_id)
  if (brv) return brv

  // Encode location, booker_name and status into note field
  // (bookings table may not have these columns yet — run supabase/migrations/add_bookings_columns.sql)
  const encodedNote = [
    `[kohde:${location}]`,
    booker_name ? `[varaaja:${booker_name}]` : null,
    '[tila:pending]',
    note,
  ].filter(Boolean).join('\n')

  const admin = createAdminClient()
  const { error: insertError } = await admin.from('bookings').insert({
    club_id: profile.club_id,
    profile_id: user.id,
    starts_on,
    ends_on,
    note: encodedNote,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Send email notification — failure is non-fatal
  const locationLabel = LOCATION_LABELS[location]
  const bookerDisplay = booker_name ?? profile.full_name ?? user.email ?? 'Tuntematon'

  // Determine notification recipients
  // 1. Check cabin_info for approver_email and booking_notification_email
  const { data: cabinInfoRaw } = await admin
    .from('cabin_info')
    .select('booking_notification_email, approver_name, approver_email')
    .eq('club_id', profile.club_id)
    .maybeSingle()
  const cabinInfo = cabinInfoRaw as {
    booking_notification_email: string | null
    approver_name: string | null
    approver_email: string | null
  } | null

  let notificationEmails: string[] = []

  // Add approver_email if set
  if (cabinInfo?.approver_email) {
    notificationEmails.push(cabinInfo.approver_email)
  }

  // Add booking_notification_email if set (and not already included)
  if (cabinInfo?.booking_notification_email && !notificationEmails.includes(cabinInfo.booking_notification_email)) {
    notificationEmails.push(cabinInfo.booking_notification_email)
  }

  // Fallback: first 3 admins/board_members
  if (notificationEmails.length === 0) {
    const { data: adminProfilesRaw } = await admin
      .from('profiles')
      .select('email')
      .eq('club_id', profile.club_id)
      .in('role', ['admin', 'board_member'])
      .not('email', 'is', null)
      .limit(3)
    notificationEmails = ((adminProfilesRaw ?? []) as { email: string | null }[])
      .map((p) => p.email)
      .filter((e): e is string => Boolean(e))
  }

  if (notificationEmails.length === 0) {
    return NextResponse.json({ ok: true })
  }

  // Fetch club name for email
  const { data: clubRaw } = await admin
    .from('clubs')
    .select('name')
    .eq('id', profile.club_id)
    .single()
  const clubNameForEmail = (clubRaw as { name: string | null } | null)?.name ?? 'Metsästysseura'

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails
    .send({
      from: FROM,
      to: notificationEmails,
      subject: `Uusi varauspyyntö – ${clubNameForEmail}`,
      html: `
        <h2 style="color:#166534">Uusi varauspyyntö – ${clubNameForEmail}</h2>
        <table style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Varaaja:</td><td style="padding:4px 0;font-weight:bold;">${bookerDisplay}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Ajankohta:</td><td style="padding:4px 0;font-weight:bold;">${starts_on} – ${ends_on}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Sijainti:</td><td style="padding:4px 0;font-weight:bold;">${locationLabel}</td></tr>
          ${note ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Lisätiedot:</td><td style="padding:4px 0;">${note}</td></tr>` : ''}
        </table>
        <p style="margin-top:16px;">
          Hyväksy tai hylkää varaus hallintosivulla:<br/>
          <a href="https://jahtipro.fi/hallinto" style="color:#166534;font-weight:bold;">https://jahtipro.fi/hallinto</a>
        </p>
      `.trim(),
    })
    .catch(() => {})

  return NextResponse.json({ ok: true })
}
