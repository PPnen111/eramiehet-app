import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { invoiceHtml, invoiceSubject, type InvoiceEmailData } from '@/lib/emails/invoice'

const FROM = 'Erämiesten App <noreply@eramiehet.fi>'
// Use onboarding@resend.dev while domain noreply@eramiehet.fi is not yet verified in Resend

type PaymentRow = {
  id: string
  club_id: string
  profile_id: string
  description: string
  amount_cents: number
  due_date: string | null
  status: string
}

type ProfileRow = {
  full_name: string | null
  email: string | null
}

type ClubRow = {
  name: string | null
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || !('payment_id' in body)) {
    return NextResponse.json({ error: 'payment_id required' }, { status: 400 })
  }

  const paymentId = (body as Record<string, unknown>).payment_id
  if (typeof paymentId !== 'string' || !paymentId) {
    return NextResponse.json({ error: 'payment_id must be a non-empty string' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch payment
  const { data: paymentRaw, error: paymentError } = await admin
    .from('payments')
    .select('id, club_id, profile_id, description, amount_cents, due_date, status')
    .eq('id', paymentId)
    .single()

  if (paymentError || !paymentRaw) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  const payment = paymentRaw as PaymentRow

  // Fetch member profile
  const { data: profileRaw } = await admin
    .from('profiles')
    .select('full_name, email')
    .eq('id', payment.profile_id)
    .single()

  const profile = profileRaw as ProfileRow | null

  if (!profile?.email) {
    return NextResponse.json({ error: 'Member has no email address' }, { status: 422 })
  }

  // Try to fetch club name — clubs table may or may not exist
  let clubName = 'Metsästysseura'
  let adminEmail = 'info@eramiehet.fi'

  const { data: clubRaw } = await admin
    .from('clubs')
    .select('name')
    .eq('id', payment.club_id)
    .single()

  if (clubRaw) {
    const club = clubRaw as ClubRow
    if (club.name) clubName = club.name
  }

  // Try to fetch admin email from the club's admin profile
  const { data: adminProfileRaw } = await admin
    .from('profiles')
    .select('email')
    .eq('club_id', payment.club_id)
    .in('role', ['admin', 'board_member'])
    .not('email', 'is', null)
    .limit(1)
    .single()

  if (adminProfileRaw) {
    const ap = adminProfileRaw as { email: string | null }
    if (ap.email) adminEmail = ap.email
  }

  const emailData: InvoiceEmailData = {
    memberName: profile.full_name ?? 'Jäsen',
    clubName,
    description: payment.description,
    amountCents: payment.amount_cents,
    dueDate: payment.due_date,
    paymentId: payment.id,
    adminEmail,
  }

  const resend = new Resend(apiKey)
  const { error: sendError } = await resend.emails.send({
    from: FROM,
    to: profile.email,
    subject: invoiceSubject(emailData),
    html: invoiceHtml(emailData),
  })

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
