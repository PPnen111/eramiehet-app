import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('club_id, active_club_id').eq('id', user.id).single()
  const clubId = (profile as { club_id: string; active_club_id: string | null } | null)?.active_club_id ?? (profile as { club_id: string } | null)?.club_id
  if (!clubId) return NextResponse.json({ error: 'No club' }, { status: 400 })

  const admin = createAdminClient()
  const { data } = await admin.from('onboarding').select('*').eq('club_id', clubId).maybeSingle()
  const { data: club } = await admin.from('clubs').select('name, business_id, street_address, postal_address, email, phone').eq('id', clubId).single()

  return NextResponse.json({ onboarding: data, club, club_id: clubId })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('club_id, active_club_id').eq('id', user.id).single()
  const clubId = (profile as { club_id: string; active_club_id: string | null } | null)?.active_club_id ?? (profile as { club_id: string } | null)?.club_id
  if (!clubId) return NextResponse.json({ error: 'No club' }, { status: 400 })

  const body = (await req.json()) as Record<string, unknown>
  const allowed = ['step', 'step1_completed', 'step2_completed', 'step3_completed', 'step4_completed', 'has_cabin', 'members_imported']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) if (k in body) update[k] = body[k]

  const admin = createAdminClient()
  const { error } = await admin.from('onboarding').update(update).eq('club_id', clubId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
