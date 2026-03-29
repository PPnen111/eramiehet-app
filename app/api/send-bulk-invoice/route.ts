import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { invoiceHtml, invoiceSubject, type InvoiceEmailData } from '@/lib/emails/invoice'
import { generateReferenceNumber } from '@/lib/utils/reference-number'

const FROM = 'JahtiPro <noreply@jahtipro.fi>'

type MemberRow = {
  id: string
  full_name: string | null
  email: string | null
}

type ExistingPayment = {
  profile_id: string
}

type RequestBody = {
  club_id: string
  description: string
  amount_cents: number
  due_date: string | null
  payment_type: string
  additional_info: string | null
  send_email: boolean
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('role, club_id, active_club_id')
    .eq('id', user.id)
    .single()

  const caller = callerRaw as { role: string | null; club_id: string | null; active_club_id: string | null } | null
  if (!isBoardOrAbove(caller?.role)) {
    return NextResponse.json({ error: 'Ei käyttöoikeutta' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('club_id' in body) ||
    !('description' in body) ||
    !('amount_cents' in body)
  ) {
    return NextResponse.json({ error: 'Puuttuvat kentät' }, { status: 400 })
  }

  const {
    club_id,
    description,
    amount_cents,
    due_date,
    payment_type,
    additional_info,
    send_email,
  } = body as RequestBody

  // Verify caller belongs to this club
  const callerClubId = caller?.active_club_id ?? caller?.club_id
  if (callerClubId !== club_id) {
    return NextResponse.json({ error: 'Ei oikeutta tähän seuraan' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Fetch active members of the club
  const { data: membersRaw } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('club_id', club_id)
    .eq('member_status', 'active')

  const members = (membersRaw ?? []) as unknown as MemberRow[]
  if (members.length === 0) {
    return NextResponse.json({ created: 0, sent: 0, skipped: 0 })
  }

  // Dedup: find existing payments with same description in current year for this club
  const currentYear = new Date().getFullYear()
  const yearStart = `${currentYear}-01-01`
  const yearEnd = `${currentYear + 1}-01-01`

  const { data: existingRaw } = await admin
    .from('payments')
    .select('profile_id')
    .eq('club_id', club_id)
    .eq('description', description)
    .gte('due_date', yearStart)
    .lt('due_date', yearEnd)

  const existing = (existingRaw ?? []) as unknown as ExistingPayment[]
  const existingProfileIds = new Set(existing.map((e) => e.profile_id))

  const toCreate = members.filter((m) => !existingProfileIds.has(m.id))
  const skipped = members.length - toCreate.length

  if (toCreate.length === 0) {
    return NextResponse.json({ created: 0, sent: 0, skipped })
  }

  // Generate a shared bulk_id
  const bulkId = crypto.randomUUID()

  // Insert payment rows
  const insertRows = toCreate.map((m) => ({
    club_id,
    profile_id: m.id,
    description,
    amount_cents,
    due_date: due_date ?? null,
    status: 'pending',
    payment_type,
    reference_number: generateReferenceNumber(),
    additional_info: additional_info ?? null,
    bulk_id: bulkId,
  }))

  const { data: insertedRaw, error: insertError } = await admin
    .from('payments')
    .insert(insertRows)
    .select('id, profile_id')

  if (insertError || !insertedRaw) {
    console.error('Bulk insert error:', insertError)
    return NextResponse.json({ error: insertError?.message ?? 'Insertointi epäonnistui' }, { status: 500 })
  }

  const inserted = insertedRaw as { id: string; profile_id: string }[]
  let sent = 0

  if (send_email) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY puuttuu', created: inserted.length, sent: 0, skipped },
        { status: 500 }
      )
    }

    // Fetch club name
    const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', club_id).single()
    const clubName = (clubRaw as { name: string } | null)?.name ?? 'Metsästysseura'

    // Fetch admin email
    const { data: adminProfileRaw } = await admin
      .from('profiles')
      .select('email')
      .eq('club_id', club_id)
      .in('role', ['admin', 'board_member'])
      .not('email', 'is', null)
      .limit(1)
      .single()
    const adminEmail =
      (adminProfileRaw as { email: string | null } | null)?.email ?? 'info@eramiehet.fi'

    const resend = new Resend(apiKey)
    const memberMap = new Map(members.map((m) => [m.id, m]))
    const sentPaymentIds: string[] = []

    for (const row of inserted) {
      const member = memberMap.get(row.profile_id)
      if (!member?.email) continue

      const emailData: InvoiceEmailData = {
        memberName: member.full_name ?? 'Jäsen',
        clubName,
        description,
        amountCents: amount_cents,
        dueDate: due_date,
        paymentId: row.id,
        adminEmail,
      }

      const { error: sendError } = await resend.emails.send({
        from: FROM,
        to: member.email,
        subject: invoiceSubject(emailData),
        html: invoiceHtml(emailData),
      })

      if (!sendError) {
        sent++
        sentPaymentIds.push(row.id)
      }
    }

    // Mark sent_at for successfully sent payments
    if (sentPaymentIds.length > 0) {
      await admin
        .from('payments')
        .update({ sent_at: new Date().toISOString() })
        .in('id', sentPaymentIds)
    }
  }

  return NextResponse.json({ created: inserted.length, sent, skipped })
}
