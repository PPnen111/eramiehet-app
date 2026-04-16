import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

async function getCaller() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('club_id, active_club_id, role').eq('id', user.id).single()
  const p = data as { club_id: string; active_club_id: string | null; role: string } | null
  if (!p) return null
  return { userId: user.id, clubId: p.active_club_id ?? p.club_id, role: p.role }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const caller = await getCaller()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isBoardOrAbove(caller.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as Partial<{
    guest_name: string
    guest_email: string | null
    host_profile_id: string | null
    host_registry_id: string | null
    area: string | null
    valid_from: string | null
    valid_until: string | null
    price_cents: number | null
    status: 'active' | 'expired' | 'cancelled'
    notes: string | null
  }>

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('guest_permits')
    .select('id, club_id')
    .eq('id', id)
    .eq('club_id', caller.clubId)
    .maybeSingle()
  if (!existing) return NextResponse.json({ error: 'Lupaa ei löydy' }, { status: 404 })

  const { error } = await admin.from('guest_permits').update(body).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const caller = await getCaller()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isBoardOrAbove(caller.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('guest_permits')
    .select('id, club_id')
    .eq('id', id)
    .eq('club_id', caller.clubId)
    .maybeSingle()
  if (!existing) return NextResponse.json({ error: 'Lupaa ei löydy' }, { status: 404 })

  // Soft-cancel: set status='cancelled' rather than deleting the row
  const { error } = await admin.from('guest_permits').update({ status: 'cancelled' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
