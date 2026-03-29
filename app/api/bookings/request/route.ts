import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const LOCATION_LABELS: Record<string, string> = {
  erakartano: 'Eräkartano',
  takkatupa: 'Takkatupa',
  sauna: 'Sauna',
  nylkyvaja: 'Nylkyvaja',
  majoitustilat: 'Majoitustilat',
}

const FROM = 'JahtiPro <noreply@jahtipro.fi>'
const APPROVAL_EMAIL = 'jpsimola1@gmail.com'

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

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails
    .send({
      from: FROM,
      to: APPROVAL_EMAIL,
      subject: `Uusi varauspyyntö – ${locationLabel} ${starts_on}`,
      html: `
        <h2 style="color:#166534">Uusi varauspyyntö</h2>
        <p><strong>Kohde:</strong> ${locationLabel}</p>
        <p><strong>Ajankohta:</strong> ${starts_on} – ${ends_on}</p>
        <p><strong>Varaaja:</strong> ${bookerDisplay}</p>
        ${note ? `<p><strong>Lisätiedot:</strong> ${note}</p>` : ''}
        <p style="margin-top:16px;color:#6b7280">
          Kirjaudu sovellukseen vahvistaaksesi varauksen.
        </p>
      `.trim(),
    })
    .catch(() => {})

  return NextResponse.json({ ok: true })
}
