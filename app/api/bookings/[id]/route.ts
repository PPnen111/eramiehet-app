import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { guardTenant } from '@/lib/tenant'

type ProfileRow = { club_id: string; active_club_id: string | null; role: string; id: string }

async function getCaller(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, club_id, active_club_id, role')
    .eq('id', user.id)
    .single()

  const caller = profileRaw as ProfileRow | null
  if (!caller) return null

  return { ...caller, clubId: caller.active_club_id ?? caller.club_id }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const caller = await getCaller(supabase)
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }
  const bv1 = await guardTenant({ id: caller.id, role: caller.role, club_id: caller.club_id, active_club_id: caller.active_club_id }, caller.clubId)
  if (bv1) return bv1

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch current booking
  const { data: bookingRaw } = await admin
    .from('bookings')
    .select('id, note, club_id')
    .eq('id', id)
    .eq('club_id', caller.clubId)
    .maybeSingle()

  if (!bookingRaw) return NextResponse.json({ error: 'Varausta ei löydy' }, { status: 404 })
  const booking = bookingRaw as { id: string; note: string | null; club_id: string }

  // Build update object
  const update: Record<string, unknown> = {}

  if (typeof body.starts_on === 'string') update.starts_on = body.starts_on
  if (typeof body.ends_on === 'string') update.ends_on = body.ends_on

  // Rebuild note field with metadata
  let currentNote = booking.note ?? ''

  // Update location
  if (typeof body.location === 'string') {
    if (currentNote.includes('[kohde:')) {
      currentNote = currentNote.replace(/\[kohde:[^\]]+\]/, `[kohde:${body.location}]`)
    } else {
      currentNote = `[kohde:${body.location}]\n${currentNote}`
    }
  }

  // Update booker name
  if (typeof body.booker_name === 'string') {
    if (currentNote.includes('[varaaja:')) {
      currentNote = currentNote.replace(/\[varaaja:[^\]]+\]/, `[varaaja:${body.booker_name}]`)
    } else {
      // Insert after [kohde:...] if present
      currentNote = currentNote.replace(
        /(\[kohde:[^\]]+\]\n?)/,
        `$1[varaaja:${body.booker_name}]\n`
      )
      if (!currentNote.includes('[varaaja:')) {
        currentNote = `[varaaja:${body.booker_name}]\n${currentNote}`
      }
    }
  }

  // Update status
  if (typeof body.status === 'string') {
    if (currentNote.includes('[tila:')) {
      currentNote = currentNote.replace(/\[tila:[^\]]+\]/, `[tila:${body.status}]`)
    } else {
      currentNote = `[tila:${body.status}]\n${currentNote}`
    }
  }

  // Update free-text note
  if (typeof body.note === 'string' || body.note === null) {
    // Strip existing free-text (everything after metadata tags)
    const lines = currentNote.split('\n')
    const metaLines = lines.filter(
      (l) => l.match(/^\[kohde:/) || l.match(/^\[varaaja:/) || l.match(/^\[tila:/)
    )
    const newNote = body.note as string | null
    currentNote = [...metaLines, ...(newNote ? [newNote] : [])].join('\n')
  }

  update.note = currentNote

  const { error } = await admin
    .from('bookings')
    .update(update)
    .eq('id', id)
    .eq('club_id', caller.clubId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const caller = await getCaller(supabase)
  if (!caller) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })
  const bv2 = await guardTenant({ id: caller.id, role: caller.role, club_id: caller.club_id, active_club_id: caller.active_club_id }, caller.clubId)
  if (bv2) return bv2

  const admin = createAdminClient()

  // Fetch booking
  const { data: bookingRaw } = await admin
    .from('bookings')
    .select('id, note, profile_id, club_id')
    .eq('id', id)
    .maybeSingle()

  const booking = bookingRaw as { id: string; note: string | null; profile_id: string; club_id: string } | null
  if (!booking) return NextResponse.json({ error: 'Varausta ei löydy' }, { status: 404 })

  const effectiveClubId = caller.clubId
  if (booking.club_id !== effectiveClubId) {
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
