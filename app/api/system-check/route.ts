import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Check = { name: string; status: 'ok' | 'warning' | 'error'; detail?: string | number | string[] }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const checks: Check[] = []

  // 1. Database connection
  try {
    await admin.from('clubs').select('id').limit(1)
    checks.push({ name: 'Database connection', status: 'ok' })
  } catch {
    checks.push({ name: 'Database connection', status: 'error', detail: 'Connection failed' })
  }

  // 2. Audit events
  const { count: auditCount } = await admin.from('audit_events').select('*', { count: 'exact', head: true })
  checks.push({ name: 'audit_events table', status: 'ok', detail: auditCount ?? 0 })

  // 3. Plan limits
  const { count: planCount } = await admin.from('plan_limits').select('*', { count: 'exact', head: true })
  checks.push({ name: 'plan_limits configured', status: (planCount ?? 0) > 0 ? 'ok' : 'warning', detail: planCount ?? 0 })

  // 4. Resend API key
  checks.push({ name: 'Resend API key', status: process.env.RESEND_API_KEY ? 'ok' : 'error', detail: process.env.RESEND_API_KEY ? 'set' : 'missing' })

  // 5. CRON_SECRET
  checks.push({ name: 'CRON_SECRET', status: process.env.CRON_SECRET ? 'ok' : 'warning', detail: process.env.CRON_SECRET ? 'set' : 'missing' })

  // 6. Clubs with no onboarding
  const { data: clubs } = await admin.from('clubs').select('id')
  const clubIds = ((clubs ?? []) as { id: string }[]).map((c) => c.id)
  if (clubIds.length > 0) {
    const { data: obRows } = await admin.from('onboarding').select('club_id, completed_at').in('club_id', clubIds)
    const obMap = new Map(((obRows ?? []) as { club_id: string; completed_at: string | null }[]).map((o) => [o.club_id, o.completed_at]))
    const noOnboarding = clubIds.filter((id) => !obMap.has(id))
    const incompleteOnboarding = clubIds.filter((id) => obMap.has(id) && !obMap.get(id))
    checks.push({ name: 'Clubs without onboarding row', status: noOnboarding.length > 0 ? 'warning' : 'ok', detail: noOnboarding.length })
    checks.push({ name: 'Clubs with incomplete onboarding', status: incompleteOnboarding.length > 0 ? 'warning' : 'ok', detail: incompleteOnboarding.length })
  }

  // 7. Expired trials
  const { data: expiredRaw } = await admin.from('subscriptions').select('club_id').eq('status', 'trial').lt('trial_ends_at', new Date().toISOString())
  const expiredCount = (expiredRaw ?? []).length
  checks.push({ name: 'Expired trials', status: expiredCount > 0 ? 'warning' : 'ok', detail: expiredCount })

  // 8. Pending registrations
  const { count: pendingRegs } = await admin.from('registration_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  checks.push({ name: 'Pending registrations', status: (pendingRegs ?? 0) > 0 ? 'warning' : 'ok', detail: pendingRegs ?? 0 })

  return NextResponse.json({ checks, timestamp: new Date().toISOString() })
}
