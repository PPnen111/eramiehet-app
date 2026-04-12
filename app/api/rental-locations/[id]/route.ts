import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

async function getCallerClub(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('club_id, active_club_id, role').eq('id', user.id).single()
  const p = data as { club_id: string; active_club_id: string | null; role: string } | null
  if (!p || !isBoardOrAbove(p.role)) return null
  return { clubId: p.active_club_id ?? p.club_id }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const caller = await getCallerClub(supabase)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: location } = await admin.from('rental_locations').select('*').eq('id', id).eq('club_id', caller.clubId).single()
  if (!location) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: approvers } = await admin.from('rental_location_approvers').select('*').eq('rental_location_id', id).order('is_primary', { ascending: false })

  return NextResponse.json({ location, approvers: approvers ?? [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const caller = await getCallerClub(supabase)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as Record<string, unknown>
  const allowed = ['name', 'location_type', 'description', 'pricing_text', 'instructions_text', 'max_capacity', 'booking_unit', 'min_booking_hours', 'is_active', 'sort_order']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) if (k in body) update[k] = body[k]

  const admin = createAdminClient()
  const { error } = await admin.from('rental_locations').update(update).eq('id', id).eq('club_id', caller.clubId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const caller = await getCallerClub(supabase)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  await admin.from('rental_location_approvers').delete().eq('rental_location_id', id)
  const { error } = await admin.from('rental_locations').delete().eq('id', id).eq('club_id', caller.clubId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
