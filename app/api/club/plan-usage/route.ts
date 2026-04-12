import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { checkPlanLimit } from '@/lib/plan-limits'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, active_club_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { club_id: string; active_club_id: string | null; role: string } | null
  if (!profile || !isBoardOrAbove(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const clubId = profile.active_club_id ?? profile.club_id

  const admin = createAdminClient()

  // Fetch subscription
  const { data: subRaw } = await admin.from('subscriptions')
    .select('status, plan, trial_ends_at, subscription_ends_at, price_per_year')
    .eq('club_id', clubId)
    .maybeSingle()
  const sub = subRaw as { status: string; plan: string | null; trial_ends_at: string | null; subscription_ends_at: string | null; price_per_year: number | null } | null

  // Fetch plan label
  const plan = sub?.plan ?? 'trial'
  const { data: planRow } = await admin.from('plan_limits').select('label, price_per_year_cents').eq('plan', plan).maybeSingle()
  const planLabel = (planRow as { label: string } | null)?.label ?? plan
  const pricePerYear = (planRow as { price_per_year_cents: number } | null)?.price_per_year_cents ?? sub?.price_per_year ?? 0

  // Check each resource
  const resources = ['members', 'rental_locations', 'documents', 'groups', 'admins'] as const
  const usage: Record<string, { current: number; limit: number; percent: number }> = {}

  for (const r of resources) {
    const check = await checkPlanLimit(clubId, r)
    usage[r] = {
      current: check.current,
      limit: check.limit,
      percent: check.limit > 0 ? Math.round((check.current / check.limit) * 100) : 0,
    }
  }

  return NextResponse.json({
    plan,
    plan_label: planLabel,
    status: sub?.status ?? 'trial',
    trial_ends_at: sub?.trial_ends_at ?? null,
    subscription_ends_at: sub?.subscription_ends_at ?? null,
    price_per_year_cents: pricePerYear,
    usage,
  })
}
