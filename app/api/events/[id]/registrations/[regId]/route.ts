import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

type ProfileRow = { club_id: string; role: string }

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const { id: eventId, regId } = await params
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

  const caller = profileRaw as ProfileRow | null
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Verify the event belongs to caller's club
  const { data: eventRaw } = await admin
    .from('events')
    .select('club_id')
    .eq('id', eventId)
    .maybeSingle()

  const event = eventRaw as { club_id: string } | null
  if (!event || event.club_id !== caller.club_id) {
    return NextResponse.json({ error: 'Tapahtumaa ei löydy' }, { status: 404 })
  }

  const { error } = await admin
    .from('event_registrations')
    .delete()
    .eq('id', regId)
    .eq('event_id', eventId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
