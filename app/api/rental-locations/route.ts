import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { checkPlanLimit, limitExceededResponse } from '@/lib/plan-limits'

async function getCallerClub(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('club_id, active_club_id, role').eq('id', user.id).single()
  const p = data as { club_id: string; active_club_id: string | null; role: string } | null
  if (!p || !isBoardOrAbove(p.role)) return null
  return { userId: user.id, clubId: p.active_club_id ?? p.club_id, role: p.role }
}

export async function GET() {
  const supabase = await createClient()
  const caller = await getCallerClub(supabase)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: locations } = await admin
    .from('rental_locations')
    .select('*')
    .eq('club_id', caller.clubId)
    .order('sort_order', { ascending: true })

  const { data: approvers } = await admin
    .from('rental_location_approvers')
    .select('rental_location_id')
    .eq('club_id', caller.clubId)

  const approverCounts = new Map<string, number>()
  for (const a of (approvers ?? []) as { rental_location_id: string }[]) {
    approverCounts.set(a.rental_location_id, (approverCounts.get(a.rental_location_id) ?? 0) + 1)
  }

  const result = ((locations ?? []) as Record<string, unknown>[]).map((l) => ({
    ...l,
    approver_count: approverCounts.get(l.id as string) ?? 0,
  }))

  return NextResponse.json({ locations: result })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const caller = await getCallerClub(supabase)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const check = await checkPlanLimit(caller.clubId, 'rental_locations')
  if (!check.allowed) return limitExceededResponse(check)

  const body = (await req.json()) as Record<string, unknown>
  const admin = createAdminClient()

  const { data, error } = await admin.from('rental_locations').insert({
    club_id: caller.clubId,
    name: body.name ?? '',
    location_type: body.location_type ?? 'muu',
    description: body.description ?? null,
    pricing_text: body.pricing_text ?? null,
    instructions_text: body.instructions_text ?? null,
    max_capacity: body.max_capacity ? Number(body.max_capacity) : null,
    booking_unit: body.booking_unit ?? 'day',
    min_booking_hours: body.min_booking_hours ? Number(body.min_booking_hours) : null,
    is_active: body.is_active !== false,
    sort_order: body.sort_order ? Number(body.sort_order) : 0,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: (data as { id: string }).id })
}
