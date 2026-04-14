import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

async function getCallerClub() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('club_id, active_club_id, role').eq('id', user.id).single()
  const p = data as { club_id: string; active_club_id: string | null; role: string } | null
  if (!p || !isBoardOrAbove(p.role)) return null
  return { clubId: p.active_club_id ?? p.club_id }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const caller = await getCallerClub()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('member_registry')
    .select('*')
    .eq('id', id)
    .eq('club_id', caller.clubId)
    .maybeSingle()

  if (!data) return NextResponse.json({ error: 'Ei löydy' }, { status: 404 })
  return NextResponse.json({ member: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const caller = await getCallerClub()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as Record<string, unknown>
  const allowed = [
    'full_name', 'email', 'phone', 'member_number', 'birth_date',
    'member_type', 'street_address', 'postal_code', 'city',
    'home_municipality', 'billing_method', 'additional_info',
  ]
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) if (k in body) update[k] = body[k]

  const admin = createAdminClient()
  const { error } = await admin
    .from('member_registry')
    .update(update)
    .eq('id', id)
    .eq('club_id', caller.clubId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const caller = await getCallerClub()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('member_registry')
    .delete()
    .eq('id', id)
    .eq('club_id', caller.clubId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
