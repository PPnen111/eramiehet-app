import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

type ProfileRow = { club_id: string; role: string }

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

  // Fetch current note to update [tila:...] tag
  const { data: booking } = await admin
    .from('bookings')
    .select('note')
    .eq('id', id)
    .eq('club_id', profile.club_id)
    .single()

  const currentNote = (booking as { note: string | null } | null)?.note ?? ''
  const updatedNote = currentNote.includes('[tila:')
    ? currentNote.replace(/\[tila:[^\]]+\]/, '[tila:confirmed]')
    : `[tila:confirmed]\n${currentNote}`

  const { error } = await admin
    .from('bookings')
    .update({ note: updatedNote })
    .eq('id', id)
    .eq('club_id', profile.club_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
