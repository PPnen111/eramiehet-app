import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

type ProfileRow = { club_id: string; role: string; id: string }

export async function DELETE(
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
    .select('id, club_id, role')
    .eq('id', user.id)
    .single()

  const caller = profileRaw as ProfileRow | null
  if (!caller) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()

  // Fetch booking to verify club and ownership
  const { data: bookingRaw } = await admin
    .from('bookings')
    .select('note, profile_id, club_id')
    .eq('id', id)
    .maybeSingle()

  const booking = bookingRaw as { note: string | null; profile_id: string; club_id: string } | null
  if (!booking) return NextResponse.json({ error: 'Varausta ei löydy' }, { status: 404 })
  if (booking.club_id !== caller.club_id) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  // Admin can cancel any booking; member can only cancel their own
  const isAdmin = isBoardOrAbove(caller.role)
  if (!isAdmin && booking.profile_id !== caller.id) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  // Soft-cancel: update note to set [tila:cancelled]
  const currentNote = booking.note ?? ''
  const updatedNote = currentNote.includes('[tila:')
    ? currentNote.replace(/\[tila:[^\]]+\]/, '[tila:cancelled]')
    : `[tila:cancelled]\n${currentNote}`

  const { error } = await admin
    .from('bookings')
    .update({ note: updatedNote })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
