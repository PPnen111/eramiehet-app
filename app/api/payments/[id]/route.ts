import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

type ProfileRow = { club_id: string; active_club_id: string | null; role: string }

async function getCaller(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, active_club_id, role')
    .eq('id', user.id)
    .single()

  const caller = profileRaw as ProfileRow | null
  if (!caller || !isBoardOrAbove(caller.role)) return null

  return { ...caller, clubId: caller.active_club_id ?? caller.club_id }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const caller = await getCaller(supabase)
  if (!caller) return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only allow updating specific fields
  const allowed: Record<string, unknown> = {}
  if (typeof body.status === 'string') allowed.status = body.status
  if (typeof body.paid_at === 'string' || body.paid_at === null) allowed.paid_at = body.paid_at

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Ei päivitettäviä kenttiä' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('payments')
    .update(allowed)
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
  if (!caller) return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })

  const admin = createAdminClient()

  // Verify payment exists and belongs to club
  const { data: paymentRaw } = await admin
    .from('payments')
    .select('id')
    .eq('id', id)
    .eq('club_id', caller.clubId)
    .maybeSingle()

  if (!paymentRaw) return NextResponse.json({ error: 'Laskua ei löydy' }, { status: 404 })

  const { error } = await admin
    .from('payments')
    .delete()
    .eq('id', id)
    .eq('club_id', caller.clubId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
