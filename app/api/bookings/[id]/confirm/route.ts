import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

const FROM = 'JahtiPro <noreply@jahtipro.fi>'

type ProfileRow = { club_id: string; role: string }
type BookingRow = { note: string | null; profile_id: string; starts_on: string; ends_on: string }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as ProfileRow | null
  if (!profile || !isBoardOrAbove(profile.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Fetch booking: note + fields needed for confirmation email
  const { data: bookingRaw } = await admin
    .from('bookings')
    .select('note, profile_id, starts_on, ends_on')
    .eq('id', id)
    .eq('club_id', profile.club_id)
    .single()

  const booking = bookingRaw as BookingRow | null
  if (!booking) return NextResponse.json({ error: 'Varausta ei löydy' }, { status: 404 })

  const currentNote = booking.note ?? ''
  const updatedNote = currentNote.includes('[tila:')
    ? currentNote.replace(/\[tila:[^\]]+\]/, '[tila:confirmed]')
    : `[tila:confirmed]\n${currentNote}`

  const { error } = await admin
    .from('bookings')
    .update({ note: updatedNote })
    .eq('id', id)
    .eq('club_id', profile.club_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send confirmation email to booker — non-fatal
  const [bookerResult, clubResult] = await Promise.all([
    admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', booking.profile_id)
      .maybeSingle(),
    admin
      .from('clubs')
      .select('name')
      .eq('id', profile.club_id)
      .maybeSingle(),
  ])

  const booker = bookerResult.data as { full_name: string | null; email: string | null } | null
  const clubName = (clubResult.data as { name: string | null } | null)?.name ?? 'Seura'

  if (booker?.email) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails
      .send({
        from: FROM,
        to: booker.email,
        subject: 'Varauksesi on vahvistettu ✅',
        html: `
          <p>Hei ${booker.full_name ?? ''}!</p>
          <p>Varauksesi on vahvistettu.</p>
          <p><strong>Ajankohta:</strong> ${formatDate(booking.starts_on)} – ${formatDate(booking.ends_on)}</p>
          <p>Nähdään!<br>${clubName}</p>
        `.trim(),
      })
      .catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
