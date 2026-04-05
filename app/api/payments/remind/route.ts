import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { reminderHtml, reminderSubject, type ReminderEmailData } from '@/lib/emails/reminder'

const FROM = 'JahtiPro <noreply@jahtipro.fi>'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('club_id, active_club_id, role')
    .eq('id', user.id)
    .single()

  const caller = callerRaw as { club_id: string; active_club_id: string | null; role: string } | null
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }
  const clubId = caller.active_club_id ?? caller.club_id

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  let body: { payment_ids: string[] }
  try {
    body = (await req.json()) as { payment_ids: string[] }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.payment_ids) || body.payment_ids.length === 0) {
    return NextResponse.json({ error: 'payment_ids required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch payments with member profiles
  const { data: paymentsRaw } = await admin
    .from('payments')
    .select('id, profile_id, description, amount_cents, due_date, status')
    .eq('club_id', clubId)
    .in('id', body.payment_ids)

  const payments = (paymentsRaw ?? []) as {
    id: string
    profile_id: string
    description: string
    amount_cents: number
    due_date: string | null
    status: string
  }[]

  if (payments.length === 0) {
    return NextResponse.json({ error: 'Laskuja ei löytynyt' }, { status: 404 })
  }

  // Fetch member profiles
  const profileIds = [...new Set(payments.map((p) => p.profile_id))]
  const { data: profilesRaw } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .in('id', profileIds)

  const profileMap = new Map(
    ((profilesRaw ?? []) as { id: string; full_name: string | null; email: string | null }[]).map(
      (p) => [p.id, p]
    )
  )

  // Fetch club name
  const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', clubId).single()
  const clubName = (clubRaw as { name: string | null } | null)?.name ?? 'Metsästysseura'

  // Fetch admin email for contact info
  const { data: adminProfileRaw } = await admin
    .from('profiles')
    .select('email')
    .eq('club_id', clubId)
    .in('role', ['admin', 'board_member'])
    .not('email', 'is', null)
    .limit(1)
    .single()
  const adminEmail = (adminProfileRaw as { email: string } | null)?.email ?? 'info@eramiehet.fi'

  const resend = new Resend(apiKey)
  let sent = 0
  let skipped = 0

  for (const payment of payments) {
    const profile = profileMap.get(payment.profile_id)
    if (!profile?.email) {
      skipped++
      continue
    }

    const today = new Date().toISOString().slice(0, 10)
    const isOverdue = payment.due_date ? payment.due_date < today : false

    const emailData: ReminderEmailData = {
      memberName: profile.full_name ?? 'Jäsen',
      clubName,
      description: payment.description,
      amountCents: payment.amount_cents,
      dueDate: payment.due_date ?? today,
      isOverdue,
      adminEmail,
    }

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: profile.email,
      subject: reminderSubject(emailData),
      html: reminderHtml(emailData),
    })

    if (!sendError) sent++
    else skipped++
  }

  return NextResponse.json({ sent, skipped })
}
