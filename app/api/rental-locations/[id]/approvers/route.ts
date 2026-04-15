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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const caller = await getCallerClub(supabase)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as Record<string, unknown>
  const admin = createAdminClient()
  const { error } = await admin.from('rental_location_approvers').insert({
    rental_location_id: id,
    club_id: caller.clubId,
    name: body.name ?? '',
    email: body.email ?? '',
    phone: body.phone ?? null,
    is_primary: body.is_primary === true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params // consume params
  const supabase = await createClient()
  const caller = await getCallerClub(supabase)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as { approver_id: string }
  const admin = createAdminClient()
  const { error } = await admin.from('rental_location_approvers').delete().eq('id', body.approver_id).eq('club_id', caller.clubId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
