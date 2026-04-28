// CRON_SECRET must be set in Vercel environment variables
// Set it in Vercel Dashboard → Settings → Environment Variables
// Value: any random string, e.g. generated with: openssl rand -base64 32

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const WEEKDAYS = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai']

const ACTION_LABELS: Record<string, string> = {
  'member.list': 'Jäsenlistan katselu',
  'document.download': 'Dokumentin lataus',
  'payment.list': 'Maksujen katselu',
  'payment.mark_paid': 'Maksun kuittaus',
  'booking.create': 'Varauksen luonti',
  'member.view': 'Jäsenen tiedot',
  'login.success': 'Kirjautuminen',
  'login.failed': 'Epäonnistunut kirjautuminen',
  'role.changed': 'Roolin muutos',
  'member.deleted': 'Jäsenen poisto',
}

function formatFiDate(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}

function formatEur(cents: number): string {
  return (cents / 100).toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })
}

async function generateReport(): Promise<{ html: string; subject: string }> {
  const admin = createAdminClient()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0).toISOString()
  const dayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59).toISOString()

  const weekday = WEEKDAYS[yesterday.getDay()]
  const dateStr = formatFiDate(yesterday)
  const subject = `JahtiPro aamuraportti — ${weekday} ${dateStr}`

  // Q1: Logins
  const { data: loginData } = await admin.from('audit_events').select('actor_id').gte('created_at', dayStart).lte('created_at', dayEnd).in('action', ['login.success', 'login.failed'])
  const logins = (loginData ?? []) as { actor_id: string }[]
  const loginTotal = logins.length
  const uniqueUsers = new Set(logins.map((l) => l.actor_id)).size

  // Q2: Actions per club
  const { data: actionsRaw } = await admin.from('audit_events').select('club_id, actor_id, outcome').gte('created_at', dayStart).lte('created_at', dayEnd)
  const actions = (actionsRaw ?? []) as { club_id: string; actor_id: string; outcome: string }[]
  const { data: clubsRaw } = await admin.from('clubs').select('id, name')
  const clubMap = new Map(((clubsRaw ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]))

  const clubStats = new Map<string, { name: string; count: number; users: Set<string>; denied: number }>()
  for (const a of actions) {
    if (!a.club_id) continue
    let s = clubStats.get(a.club_id)
    if (!s) { s = { name: clubMap.get(a.club_id) ?? '?', count: 0, users: new Set(), denied: 0 }; clubStats.set(a.club_id, s) }
    s.count++
    s.users.add(a.actor_id)
    if (a.outcome === 'denied') s.denied++
  }
  const clubRows = [...clubStats.values()].sort((a, b) => b.count - a.count)

  // Q3: Top actions
  const { data: topActionsRaw } = await admin.from('audit_events').select('action').gte('created_at', dayStart).lte('created_at', dayEnd).eq('outcome', 'success')
  const actionCounts = new Map<string, number>()
  for (const a of (topActionsRaw ?? []) as { action: string }[]) {
    actionCounts.set(a.action, (actionCounts.get(a.action) ?? 0) + 1)
  }
  const topActions = [...actionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)

  // Q4: Security
  const deniedTotal = actions.filter((a) => a.outcome === 'denied').length
  const deniedActors = new Set(actions.filter((a) => a.outcome === 'denied').map((a) => a.actor_id)).size

  // Q5: New registrations
  const { count: newRegs } = await admin.from('registration_requests').select('*', { count: 'exact', head: true }).gte('created_at', dayStart).lte('created_at', dayEnd)

  // Q6: Payments
  const { data: paymentsRaw } = await admin.from('payments').select('amount_cents').gte('updated_at', dayStart).lte('updated_at', dayEnd).eq('status', 'paid')
  const paidPayments = (paymentsRaw ?? []) as { amount_cents: number }[]
  const paidCount = paidPayments.length
  const paidTotal = paidPayments.reduce((s, p) => s + p.amount_cents, 0)

  // Q7: Expiring trials
  const now = new Date().toISOString()
  const in7d = new Date(Date.now() + 7 * 86400000).toISOString()
  const { data: expiringRaw } = await admin.from('subscriptions').select('club_id, trial_ends_at').eq('status', 'trial').gte('trial_ends_at', now).lte('trial_ends_at', in7d)
  const expiring = ((expiringRaw ?? []) as { club_id: string; trial_ends_at: string }[]).map((s) => ({
    name: clubMap.get(s.club_id) ?? '?',
    ends: new Date(s.trial_ends_at).toLocaleDateString('fi-FI'),
  }))

  // Build HTML
  const td = 'style="padding:4px 12px;border-bottom:1px solid #e5e7eb;"'
  const th = 'style="padding:4px 12px;border-bottom:2px solid #166534;text-align:left;font-weight:bold;color:#166534;"'

  let html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
<h2 style="color:#166534;">JahtiPro — Aamuraportti</h2>
<p style="color:#6b7280;">${weekday} ${dateStr} | Edellisen päivän yhteenveto</p>

<h3 style="color:#166534;margin-top:24px;">📊 Käyttö</h3>
<table style="border-collapse:collapse;width:100%;">
<tr><td ${td}>Kirjautumiset</td><td ${td}><strong>${loginTotal}</strong></td></tr>
<tr><td ${td}>Uniikit käyttäjät</td><td ${td}><strong>${uniqueUsers}</strong></td></tr>
<tr><td ${td}>Toimintoja yhteensä</td><td ${td}><strong>${actions.length}</strong></td></tr>
</table>

<h3 style="color:#166534;margin-top:24px;">🏹 Seurat</h3>`

  if (clubRows.length > 0) {
    html += `<table style="border-collapse:collapse;width:100%;"><tr><th ${th}>Seura</th><th ${th}>Toimintoja</th><th ${th}>Käyttäjiä</th><th ${th}>Hylätyt</th></tr>`
    for (const c of clubRows) {
      html += `<tr><td ${td}>${c.name}</td><td ${td}>${c.count}</td><td ${td}>${c.users.size}</td><td ${td}>${c.denied > 0 ? `<span style="color:red">${c.denied}</span>` : '0'}</td></tr>`
    }
    html += '</table>'
  } else {
    html += '<p style="color:#6b7280;">Ei aktiivisuutta.</p>'
  }

  html += `<h3 style="color:#166534;margin-top:24px;">📋 Top toiminnot eilen</h3>`
  if (topActions.length > 0) {
    html += '<table style="border-collapse:collapse;width:100%;">'
    for (const [action, count] of topActions) {
      html += `<tr><td ${td}>${ACTION_LABELS[action] ?? action}</td><td ${td}><strong>${count}</strong></td></tr>`
    }
    html += '</table>'
  } else {
    html += '<p style="color:#6b7280;">Ei toimintoja.</p>'
  }

  html += `<h3 style="color:#166534;margin-top:24px;">🔒 Tietoturva</h3>
<table style="border-collapse:collapse;width:100%;">
<tr><td ${td}>Hylättyjä pääsyyrityksiä</td><td ${td}><strong>${deniedTotal}</strong></td></tr>
<tr><td ${td}>Uniikit toimijat</td><td ${td}><strong>${deniedActors}</strong></td></tr>
</table>`

  if (deniedTotal > 5) {
    html += '<p style="color:red;font-weight:bold;">⚠️ Poikkeuksellinen määrä hylättyjä yrityksiä! Tarkista tapahtumaloki.</p>'
  }

  html += `<h3 style="color:#166534;margin-top:24px;">💰 Maksut</h3>
<table style="border-collapse:collapse;width:100%;">
<tr><td ${td}>Maksettuja laskuja eilen</td><td ${td}><strong>${paidCount}</strong></td></tr>
<tr><td ${td}>Maksettu yhteensä</td><td ${td}><strong>${paidTotal > 0 ? formatEur(paidTotal) : '—'}</strong></td></tr>
</table>

<h3 style="color:#166534;margin-top:24px;">🔔 Uudet rekisteröitymiset</h3>`

  if ((newRegs ?? 0) > 0) {
    html += `<p>✅ <strong>${newRegs}</strong> uutta rekisteröitymistä eilen!</p>
<a href="https://jahtipro.fi/operaattori" style="color:#166534;font-weight:bold;">Katso operaattorissa →</a>`
  } else {
    html += '<p style="color:#6b7280;">Ei uusia rekisteröitymisiä.</p>'
  }

  // Demo testers
  const { data: demoClubsRaw } = await admin
    .from('clubs')
    .select('id, demo_created_for_email, demo_expires_at, created_at')
    .eq('is_demo', true)
    .gt('demo_expires_at', now)
    .order('created_at', { ascending: false })
  const demoClubs = (demoClubsRaw ?? []) as { id: string; demo_created_for_email: string | null; demo_expires_at: string | null; created_at: string }[]

  type DemoTester = { email: string; expires: string; last_seen: string | null; total_sessions: number; created: string }
  const demoTesters: DemoTester[] = []

  for (const dc of demoClubs) {
    const { data: cmRaw } = await admin
      .from('club_members')
      .select('profile_id')
      .eq('club_id', dc.id)
      .eq('role', 'admin')
      .limit(1)
    const cm = (cmRaw ?? []) as { profile_id: string }[]
    if (cm.length > 0) {
      const { data: pRaw } = await admin
        .from('profiles')
        .select('last_seen_at, total_sessions')
        .eq('id', cm[0].profile_id)
        .single()
      const prof = pRaw as { last_seen_at: string | null; total_sessions: number | null } | null
      demoTesters.push({
        email: dc.demo_created_for_email ?? '?',
        expires: dc.demo_expires_at ? new Date(dc.demo_expires_at).toLocaleDateString('fi-FI') : '?',
        last_seen: prof?.last_seen_at ?? null,
        total_sessions: prof?.total_sessions ?? 0,
        created: dc.created_at,
      })
    }
  }

  // Expired demos cleaned in last 24h
  const yesterday24h = new Date(Date.now() - 86400000).toISOString()
  const { count: expiredDemoCount } = await admin
    .from('clubs')
    .select('*', { count: 'exact', head: true })
    .eq('is_demo', true)
    .lt('demo_expires_at', now)
    .gt('demo_expires_at', yesterday24h)

  html += `<h3 style="color:#166534;margin-top:24px;">📊 Demo-testaajat (${demoTesters.length} aktiivista)</h3>`
  if (demoTesters.length > 0) {
    for (const dt of demoTesters) {
      const lastSeenStr = dt.last_seen
        ? new Date(dt.last_seen).toLocaleString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'ei ole kirjautunut'
      const sessionsStr = dt.total_sessions > 0 ? `${dt.total_sessions} kertaa` : '0 kertaa (ei ole kirjautunut)'
      const icon = dt.total_sessions > 0 ? '✅' : '⏳'
      html += `<div style="margin:12px 0;padding:8px 12px;border-left:3px solid #166534;background:#f0fdf4;">
<p style="margin:0;font-weight:bold;">${icon} ${dt.email}</p>
<p style="margin:2px 0;font-size:13px;color:#6b7280;">Kirjautunut: ${sessionsStr}</p>
<p style="margin:2px 0;font-size:13px;color:#6b7280;">Viimeksi: ${lastSeenStr}</p>
<p style="margin:2px 0;font-size:13px;color:#6b7280;">Vanhenee: ${dt.expires}</p>
</div>`
    }
  } else {
    html += '<p style="color:#6b7280;">Ei aktiivisia demo-testaajia.</p>'
  }
  if ((expiredDemoCount ?? 0) > 0) {
    html += `<p>🗑 Vanhentuneet ja siivottu tänään: <strong>${expiredDemoCount}</strong></p>`
  }

  // Auto-cleanup expired demo clubs (cascade deletes members, payments, etc.)
  await admin
    .from('clubs')
    .delete()
    .eq('is_demo', true)
    .lt('demo_expires_at', yesterday24h)

  html += `<h3 style="color:#166534;margin-top:24px;">⏰ Trialit päättymässä (7 pv)</h3>`
  if (expiring.length > 0) {
    html += '<table style="border-collapse:collapse;width:100%;">'
    for (const e of expiring) {
      html += `<tr><td ${td}>${e.name}</td><td ${td}>${e.ends}</td></tr>`
    }
    html += '</table><a href="https://jahtipro.fi/operaattori" style="color:#166534;font-weight:bold;">Lähetä muistutus →</a>'
  } else {
    html += '<p style="color:#6b7280;">Ei lähiaikoina päättyviä trialeja.</p>'
  }

  html += `<hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb;">
<p style="color:#9ca3af;font-size:12px;">JahtiPro automaattiraportti | <a href="https://jahtipro.fi/operaattori" style="color:#166534;">Avaa operaattori</a></p>
</div>`

  return { html, subject }
}

// GET — Vercel cron trigger
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.warn('[CRON] CRON_SECRET not set — skipping auth check in development')
  } else {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 })

  const { html, subject } = await generateReport()

  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: 'JahtiPro <info@jahtipro.fi>',
    to: 'paunonen@gmail.com',
    subject,
    html,
  })

  return NextResponse.json({ ok: true, subject })
}

// POST — Manual trigger by superadmin
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 })

  const { html, subject } = await generateReport()

  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: 'JahtiPro <info@jahtipro.fi>',
    to: 'paunonen@gmail.com',
    subject,
    html,
  })

  return NextResponse.json({ ok: true, subject })
}
