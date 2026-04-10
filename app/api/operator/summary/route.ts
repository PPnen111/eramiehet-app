import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifySuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((data as { role: string } | null)?.role !== 'superadmin') return null
  return user
}

export async function GET() {
  if (!(await verifySuperadmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const now = Date.now()
  const d7 = new Date(now - 7 * 86400000).toISOString()
  const d14 = new Date(now + 14 * 86400000).toISOString().slice(0, 10)
  const d7future = new Date(now + 7 * 86400000).toISOString().slice(0, 10)
  const d24h = new Date(now - 24 * 3600000).toISOString()
  const d48h = new Date(now - 48 * 3600000).toISOString()
  const todayStr = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { data: clubs },
    { data: subs },
    { data: profiles },
    { data: pipeline },
    { data: signups },
    { data: payments },
    { data: auditAll },
    { data: auditDenied },
    { data: activity30d },
    { data: recentSignups },
    { data: recentPipeline },
  ] = await Promise.all([
    admin.from('clubs').select('id, name'),
    admin.from('subscriptions').select('club_id, status, plan, trial_ends_at, price_per_year'),
    admin.from('profiles').select('id').eq('member_status', 'active'),
    admin.from('sales_pipeline').select('id, club_name, status, next_action_date, updated_at, created_at'),
    admin.from('launch_signups').select('id, email, club_name, created_at'),
    admin.from('payments').select('id, status, paid_at, amount_cents'),
    admin.from('audit_events').select('id').gte('created_at', d24h),
    admin.from('audit_events').select('id').gte('created_at', d24h).eq('outcome', 'denied'),
    admin.from('activity_log').select('club_id, created_at').gte('created_at', new Date(now - 30 * 86400000).toISOString()),
    admin.from('launch_signups').select('id, email, club_name, created_at').gte('created_at', d48h).order('created_at', { ascending: false }).limit(5),
    admin.from('sales_pipeline').select('id, club_name, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const clubList = (clubs ?? []) as { id: string; name: string }[]
  const subList = (subs ?? []) as { club_id: string; status: string; plan: string | null; trial_ends_at: string | null; price_per_year: number | null }[]
  const subMap = new Map(subList.map((s) => [s.club_id, s]))
  const pipeList = (pipeline ?? []) as { id: string; club_name: string; status: string; next_action_date: string | null; updated_at: string | null; created_at: string }[]
  const signupList = (signups ?? []) as { id: string; email: string; club_name: string | null; created_at: string }[]
  const paymentList = (payments ?? []) as { id: string; status: string; paid_at: string | null; amount_cents: number }[]

  // Club counts
  const trialClubs = subList.filter((s) => s.status === 'trial')
  const activeClubs = subList.filter((s) => s.status === 'active')
  const expiringClubs = trialClubs.filter((s) => {
    if (!s.trial_ends_at) return false
    const d = s.trial_ends_at.slice(0, 10)
    return d >= todayStr && d <= d14
  })

  // Activity per club for "most active"
  const actMap = new Map<string, number>()
  for (const a of (activity30d ?? []) as { club_id: string; created_at: string }[]) {
    actMap.set(a.club_id, (actMap.get(a.club_id) ?? 0) + 1)
  }
  let topClub = { name: '—', count: 0 }
  for (const c of clubList) {
    const count = actMap.get(c.id) ?? 0
    if (count > topClub.count) topClub = { name: c.name, count }
  }

  // Pipeline
  const wonThisMonth = pipeList.filter((p) => p.status === 'won' && (p.updated_at ?? p.created_at) >= monthStart).length
  const totalPipe = pipeList.length
  const wonTotal = pipeList.filter((p) => p.status === 'won').length
  const convRate = totalPipe > 0 ? Math.round((wonTotal / totalPipe) * 100) : 0
  const overduePipeline = pipeList.filter((p) => p.next_action_date && p.next_action_date < todayStr && p.status !== 'won' && p.status !== 'lost')

  // Payments
  const pendingPayments = paymentList.filter((p) => p.status === 'pending').length
  const overduePayments = paymentList.filter((p) => p.status === 'overdue').length
  const paidThisMonth = paymentList.filter((p) => p.status === 'paid' && p.paid_at && p.paid_at >= monthStart).length

  // MRR
  const activePrices = activeClubs.map((s) => s.price_per_year ?? 0)
  const mrr = activePrices.length > 0 ? Math.round(activePrices.reduce((a, b) => a + b, 0) / 12) : 0

  // Signups
  const newSignups48h = (recentSignups ?? []) as { id: string; email: string; club_name: string | null; created_at: string }[]

  // Alerts
  type Alert = { type: string; message: string; severity: 'critical' | 'warning'; action: string; actionTab?: string; clubId?: string }
  const alerts: Alert[] = []

  // Critical: trial expiring < 7 days
  for (const s of trialClubs) {
    if (!s.trial_ends_at) continue
    const d = s.trial_ends_at.slice(0, 10)
    if (d < todayStr) continue
    if (d > d7future) continue
    const days = Math.ceil((new Date(s.trial_ends_at).getTime() - now) / 86400000)
    const club = clubList.find((c) => c.id === s.club_id)
    const act7d = (activity30d ?? []).filter((a: unknown) => {
      const row = a as { club_id: string; created_at: string }
      return row.club_id === s.club_id && row.created_at >= d7
    }).length
    alerts.push({
      type: 'trial_expiring',
      message: `${club?.name ?? 'Seura'} — trial päättyy ${days} päivässä${act7d === 0 ? ' — ei aktiivisuutta' : ''}`,
      severity: 'critical',
      action: 'Lähetä muistutus',
      clubId: s.club_id,
    })
  }

  // Warning: new signups
  if (newSignups48h.length > 0) {
    alerts.push({
      type: 'new_signups',
      message: `${newSignups48h.length} uutta kiinnostusilmoitusta — käsittelemättä`,
      severity: 'warning',
      action: 'Katso ilmoitukset',
      actionTab: 'signups',
    })
  }

  // Warning: overdue pipeline actions
  for (const p of overduePipeline.slice(0, 3)) {
    alerts.push({
      type: 'pipeline_overdue',
      message: `${p.club_name} — toimenpide oli ${p.next_action_date}`,
      severity: 'warning',
      action: 'Avaa myyntiputki',
      actionTab: 'pipeline',
    })
  }

  // Recent feed
  const feed: { icon: string; message: string; time: string }[] = []
  for (const s of newSignups48h.slice(0, 3)) {
    feed.push({ icon: '🔔', message: `Uusi kiinnostusilmoitus: ${s.club_name ?? s.email}`, time: s.created_at })
  }
  for (const p of ((recentPipeline ?? []) as { id: string; club_name: string; created_at: string }[]).slice(0, 2)) {
    feed.push({ icon: '📋', message: `Uusi prospekti: ${p.club_name}`, time: p.created_at })
  }
  feed.sort((a, b) => b.time.localeCompare(a.time))

  return NextResponse.json({
    clubs: { total: clubList.length, trial: trialClubs.length, active: activeClubs.length, expiring_14d: expiringClubs.length },
    members: { total: (profiles ?? []).length },
    pipeline: { total: totalPipe, leads: pipeList.filter((p) => p.status === 'lead').length, won_this_month: wonThisMonth, conversion_rate: convRate },
    payments: { pending: pendingPayments, overdue: overduePayments, paid_this_month: paidThisMonth },
    signups: { total: signupList.length, new_48h: newSignups48h.length },
    audit: { events_24h: (auditAll ?? []).length, denied_24h: (auditDenied ?? []).length },
    mrr,
    top_club: topClub,
    alerts,
    feed,
  })
}
