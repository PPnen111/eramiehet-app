import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { reminderHtml, reminderSubject, type ReminderEmailData } from '@/lib/emails/reminder'

const FROM = 'Erämiesten App <onboarding@resend.dev>'

type PaymentRow = {
  id: string
  club_id: string
  profile_id: string
  description: string
  amount_cents: number
  due_date: string
  status: string
}

type ProfileRow = {
  full_name: string | null
  email: string | null
}

type ClubRow = {
  name: string | null
}

/** ISO date string for today offset by +days */
function isoDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  // Protect with CRON_SECRET to prevent unauthorized calls
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

  // Payments due in exactly 7 days → advance reminder
  const { data: upcomingRaw } = await admin
    .from('payments')
    .select('id, club_id, profile_id, description, amount_cents, due_date, status')
    .eq('status', 'pending')
    .eq('due_date', inSevenDays)

  // Payments that were due yesterday → overdue notice + status update
  const { data: overdueRaw } = await admin
    .from('payments')
    .select('id, club_id, profile_id, description, amount_cents, due_date, status')
    .eq('status', 'pending')
    .eq('due_date', yesterday)

  const upcoming = (upcomingRaw ?? []) as PaymentRow[]
  const newlyOverdue = (overdueRaw ?? []) as PaymentRow[]

  // Mark yesterday's payments as overdue
  if (newlyOverdue.length > 0) {
    const ids = newlyOverdue.map((p) => p.id)
    await admin.from('payments').update({ status: 'overdue' }).in('id', ids)
  }

  // Cache club names and admin emails per club_id
  const clubCache = new Map<string, { name: string; adminEmail: string }>()

  async function getClubInfo(clubId: string): Promise<{ name: string; adminEmail: string }> {
    if (clubCache.has(clubId)) return clubCache.get(clubId)!

    let name = 'Metsästysseura'
    let adminEmail = 'info@eramiehet.fi'

    const { data: clubRaw } = await admin
      .from('clubs')
      .select('name')
      .eq('id', clubId)
      .single()

    if (clubRaw) {
      const club = clubRaw as ClubRow
      if (club.name) name = club.name
    }

    const { data: apRaw } = await admin
      .from('profiles')
      .select('email')
      .eq('club_id', clubId)
      .in('role', ['admin', 'board_member'])
      .not('email', 'is', null)
      .limit(1)
      .single()

    if (apRaw) {
      const ap = apRaw as { email: string | null }
      if (ap.email) adminEmail = ap.email
    }

    const info = { name, adminEmail }
    clubCache.set(clubId, info)
    return info
  }

  const results: { id: string; ok: boolean; error?: string }[] = []

  const sendReminder = async (payment: PaymentRow, isOverdue: boolean) => {
    const { data: profileRaw } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', payment.profile_id)
      .single()

    const profile = profileRaw as ProfileRow | null
    if (!profile?.email) return

    const club = await getClubInfo(payment.club_id)

    const emailData: ReminderEmailData = {
      memberName: profile.full_name ?? 'Jäsen',
      clubName: club.name,
      description: payment.description,
      amountCents: payment.amount_cents,
      dueDate: payment.due_date,
      isOverdue,
      adminEmail: club.adminEmail,
    }

    const { error } = await resend.emails.send({
      from: FROM,
      to: profile.email,
      subject: reminderSubject(emailData),
      html: reminderHtml(emailData),
    })

    results.push({ id: payment.id, ok: !error, error: error?.message })
  }

  // Send all reminders (sequential to respect rate limits)
  for (const p of upcoming) await sendReminder(p, false)
  for (const p of newlyOverdue) await sendReminder(p, true)

  return NextResponse.json({
    ok: true,
    date: today,
    upcomingCount: upcoming.length,
    overdueCount: newlyOverdue.length,
    results,
  })
}
