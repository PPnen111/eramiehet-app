import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { reminderHtml, reminderSubject, type ReminderEmailData } from '@/lib/emails/reminder'

const FROM = 'JahtiPro <noreply@jahtipro.fi>'
const EMAIL_CONCURRENCY = 10

type PaymentRow = {
  id: string
  club_id: string
  profile_id: string
  description: string
  amount_cents: number
  due_date: string
  status: string
}

type ProfileRow = { id: string; full_name: string | null; email: string | null }
type ClubRow = { id: string; name: string | null }
type AdminProfileRow = { club_id: string; email: string | null }

/** ISO date string for today offset by +days */
function isoDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

/** Run async tasks with bounded concurrency */
async function runConcurrent<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn))
  }
}

export async function POST(req: NextRequest) {
  // Protect with CRON_SECRET
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const admin = createAdminClient()
  const resend = new Resend(apiKey)

  const today = isoDate(0)
  const inSevenDays = isoDate(7)
  const yesterday = isoDate(-1)

  // Fetch both payment sets in parallel
  const [upcomingResult, overdueResult] = await Promise.all([
    admin
      .from('payments')
      .select('id, club_id, profile_id, description, amount_cents, due_date, status')
      .eq('status', 'pending')
      .eq('due_date', inSevenDays),
    admin
      .from('payments')
      .select('id, club_id, profile_id, description, amount_cents, due_date, status')
      .eq('status', 'pending')
      .eq('due_date', yesterday),
  ])

  const upcoming = (upcomingResult.data ?? []) as PaymentRow[]
  const newlyOverdue = (overdueResult.data ?? []) as PaymentRow[]
  const allPayments = [...upcoming, ...newlyOverdue]

  // Mark overdue payments + prefetch all needed data — in parallel
  const overdueIds = newlyOverdue.map((p) => p.id)
  const profileIds = [...new Set(allPayments.map((p) => p.profile_id))]
  const clubIds = [...new Set(allPayments.map((p) => p.club_id))]

  const [, profilesResult, clubsResult, adminProfilesResult] = await Promise.all([
    // Mark overdue
    overdueIds.length > 0
      ? admin.from('payments').update({ status: 'overdue' }).in('id', overdueIds)
      : Promise.resolve(null),
    // Batch-fetch all member profiles
    profileIds.length > 0
      ? admin.from('profiles').select('id, full_name, email').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    // Batch-fetch all clubs
    clubIds.length > 0
      ? admin.from('clubs').select('id, name').in('id', clubIds)
      : Promise.resolve({ data: [] }),
    // Batch-fetch one admin email per club
    clubIds.length > 0
      ? admin
          .from('profiles')
          .select('club_id, email')
          .in('club_id', clubIds)
          .in('role', ['admin', 'board_member'])
          .not('email', 'is', null)
      : Promise.resolve({ data: [] }),
  ])

  // Build lookup maps — O(n) total
  const profileMap = new Map(
    ((profilesResult.data ?? []) as unknown as ProfileRow[]).map((p) => [p.id, p])
  )
  const clubMap = new Map(
    ((clubsResult.data ?? []) as unknown as ClubRow[]).map((c) => [c.id, c])
  )
  const adminEmailMap = new Map<string, string>()
  for (const ap of (adminProfilesResult.data ?? []) as unknown as AdminProfileRow[]) {
    if (!adminEmailMap.has(ap.club_id) && ap.email) {
      adminEmailMap.set(ap.club_id, ap.email)
    }
  }

  const results: { id: string; ok: boolean; error?: string }[] = []

  const sendReminder = async (payment: PaymentRow, isOverdue: boolean) => {
    const profile = profileMap.get(payment.profile_id)
    if (!profile?.email) return

    const club = clubMap.get(payment.club_id)
    const emailData: ReminderEmailData = {
      memberName: profile.full_name ?? 'Jäsen',
      clubName: club?.name ?? 'Metsästysseura',
      description: payment.description,
      amountCents: payment.amount_cents,
      dueDate: payment.due_date,
      isOverdue,
      adminEmail: adminEmailMap.get(payment.club_id) ?? 'info@eramiehet.fi',
    }

    const { error } = await resend.emails.send({
      from: FROM,
      to: profile.email,
      subject: reminderSubject(emailData),
      html: reminderHtml(emailData),
    })

    results.push({ id: payment.id, ok: !error, error: error?.message })
  }

  // Send all reminders with concurrency cap — no more sequential blocking
  await runConcurrent(upcoming, (p) => sendReminder(p, false), EMAIL_CONCURRENCY)
  await runConcurrent(newlyOverdue, (p) => sendReminder(p, true), EMAIL_CONCURRENCY)

  return NextResponse.json({
    ok: true,
    date: today,
    upcomingCount: upcoming.length,
    overdueCount: newlyOverdue.length,
    results,
  })
}
