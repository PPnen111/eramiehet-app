import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminOrAbove } from '@/lib/auth'
import { invoiceHtml, invoiceSubject, type InvoiceEmailData } from '@/lib/emails/invoice'
import { generateReferenceNumber } from '@/lib/utils/reference-number'

const FROM = 'JahtiPro <onboarding@resend.dev>'

type MemberInfo = {
  profile_id: string
  role: string
  profiles: { full_name: string | null; email: string | null } | null
}

type RequestBody = {
  description: string
  amount_cents: number
  due_date: string | null
  payment_type: string
  send_email: boolean
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, active_club_id, club_id')
    .eq('id', user.id)
    .single()

  const p = profile as { role: string | null; active_club_id: string | null; club_id: string | null } | null
  if (!isAdminOrAbove(p?.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const clubId = p?.active_club_id ?? p?.club_id
  if (!clubId) return NextResponse.json({ error: 'Ei seuraa' }, { status: 400 })

  // Verify group belongs to this club
  const { data: group } = await admin
    .from('club_groups')
    .select('club_id')
    .eq('id', groupId)
    .single()

  if (!group || (group as { club_id: string }).club_id !== clubId) {
    return NextResponse.json({ error: 'Ryhmää ei löydy' }, { status: 404 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Virheellinen JSON' }, { status: 400 })
  }

  const { description, amount_cents, due_date, payment_type, send_email } = body as RequestBody

  if (!description || !amount_cents) {
    return NextResponse.json({ error: 'Puuttuvat kentät' }, { status: 400 })
  }

  // Fetch group members with profile info
  const { data: membersRaw } = await admin
    .from('club_group_members')
    .select('profile_id, role, profiles(full_name, email)')
    .eq('group_id', groupId)

  const members = (membersRaw ?? []) as unknown as MemberInfo[]
  if (members.length === 0) {
    return NextResponse.json({ created: 0, sent: 0, skipped: 0 })
  }

  const bulkId = crypto.randomUUID()
  const insertRows = members.map((m) => ({
    club_id: clubId,
    profile_id: m.profile_id,
    description,
    amount_cents,
    due_date: due_date ?? null,
    status: 'pending',
    payment_type: payment_type || 'other',
    reference_number: generateReferenceNumber(),
    bulk_id: bulkId,
  }))

  const { data: insertedRaw, error: insertError } = await admin
    .from('payments')
    .insert(insertRows)
    .select('id, profile_id')

  if (insertError || !insertedRaw) {
    return NextResponse.json({ error: insertError?.message ?? 'Insertointi epäonnistui' }, { status: 500 })
  }

  const inserted = insertedRaw as { id: string; profile_id: string }[]
  let sent = 0

  if (send_email) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ created: inserted.length, sent: 0, skipped: 0, error: 'RESEND_API_KEY puuttuu' }, { status: 500 })
    }

    const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', clubId).single()
    const clubName = (clubRaw as { name: string } | null)?.name ?? 'Metsästysseura'

    const { data: adminProfileRaw } = await admin
      .from('profiles')
      .select('email')
      .eq('club_id', clubId)
      .in('role', ['admin', 'board_member'])
      .not('email', 'is', null)
      .limit(1)
      .single()
    const adminEmail = (adminProfileRaw as { email: string | null } | null)?.email ?? 'info@eramiehet.fi'

    const resend = new Resend(apiKey)
    const memberMap = new Map(
      members.map((m) => [
        m.profile_id,
        {
          full_name: (m.profiles as unknown as { full_name: string | null } | null)?.full_name,
          email: (m.profiles as unknown as { email: string | null } | null)?.email,
        },
      ])
    )
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

    if (sentPaymentIds.length > 0) {
      await admin
        .from('payments')
        .update({ sent_at: new Date().toISOString() })
        .in('id', sentPaymentIds)
    }
  }

  return NextResponse.json({ created: inserted.length, sent, skipped: 0 })
}
