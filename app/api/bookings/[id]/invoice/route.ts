import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { generateReferenceNumber } from '@/lib/utils/reference-number'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('club_id, active_club_id, role').eq('id', user.id).single()
  const profile = profileRaw as { club_id: string; active_club_id: string | null; role: string } | null
  if (!profile || !isBoardOrAbove(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const clubId = profile.active_club_id ?? profile.club_id

  const body = (await req.json()) as { booker_email: string; description: string; amount_cents: number; due_date: string }

  const admin = createAdminClient()

  // Get club name
  const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', clubId).single()
  const clubName = (clubRaw as { name: string } | null)?.name ?? 'Metsästysseura'

  // Get booking to find rental_location_id
  const { data: bookingRaw } = await admin.from('bookings').select('rental_location_id').eq('id', id).maybeSingle()
  const rentalLocationId = (bookingRaw as { rental_location_id: string | null } | null)?.rental_location_id

  // Fetch primary approver if rental_location_id exists
  let approverName: string | null = null
  let approverEmail: string | null = null
  let approverPhone: string | null = null
  if (rentalLocationId) {
    const { data: approvers } = await admin
      .from('rental_location_approvers')
      .select('name, email, phone, is_primary')
      .eq('rental_location_id', rentalLocationId)
      .order('is_primary', { ascending: false })
      .limit(1)
    const primary = (approvers ?? [])[0] as { name: string; email: string; phone: string | null } | undefined
    if (primary) {
      approverName = primary.name
      approverEmail = primary.email
      approverPhone = primary.phone
    }
  }

  // Fetch default bank account
  const { data: bankRaw } = await admin
    .from('club_bank_accounts')
    .select('account_name, iban, bic')
    .eq('club_id', clubId)
    .eq('is_default', true)
    .maybeSingle()
  const bank = bankRaw as { account_name: string; iban: string; bic: string | null } | null

  // Generate reference number
  const refNum = generateReferenceNumber()

  // Create payment
  const { data: paymentRaw, error: payErr } = await admin.from('payments').insert({
    club_id: clubId,
    description: body.description,
    amount_cents: body.amount_cents,
    due_date: body.due_date,
    status: 'pending',
    payment_type: 'varausmaksu',
    reference_number: refNum,
  }).select('id').single()

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })

  // Send invoice email
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey && body.booker_email) {
    const amountEur = (body.amount_cents / 100).toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })
    const resend = new Resend(apiKey)

    // Build payment details section
    let paymentDetailsHtml = ''
    if (bank) {
      paymentDetailsHtml = `
<h3 style="margin-top:24px;color:#166534;">Maksutiedot</h3>
<table style="margin:8px 0;">
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Tilinumero:</td><td><strong>${bank.iban}</strong></td></tr>
${bank.bic ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">BIC:</td><td>${bank.bic}</td></tr>` : ''}
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Viitenumero:</td><td><strong>${refNum}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Eräpäivä:</td><td><strong>${body.due_date}</strong></td></tr>
</table>`
    }

    // Build signature
    let signatureHtml = `Terveisin,<br/>`
    if (approverName) {
      signatureHtml += `${approverName}<br/>`
      if (approverEmail) signatureHtml += `${approverEmail}<br/>`
      if (approverPhone) signatureHtml += `${approverPhone}<br/>`
      signatureHtml += `<br/>`
    }
    signatureHtml += `${clubName}<br/>JahtiPro-palvelu`

    await resend.emails.send({
      from: 'JahtiPro <info@jahtipro.fi>',
      to: body.booker_email,
      subject: `Lasku — varaus — ${clubName}`,
      html: `<h2 style="color:#166534">${clubName}</h2>
<p>Hei,</p>
<p>Tässä laskunne varauksen osalta.</p>
<table style="margin:16px 0;">
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Kuvaus:</td><td><strong>${body.description}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Summa:</td><td><strong>${amountEur}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Eräpäivä:</td><td><strong>${body.due_date}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Viitenumero:</td><td><strong>${refNum}</strong></td></tr>
</table>
${paymentDetailsHtml}
<p style="margin-top:24px;">${signatureHtml}</p>`.trim(),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, payment_id: (paymentRaw as { id: string }).id })
}
