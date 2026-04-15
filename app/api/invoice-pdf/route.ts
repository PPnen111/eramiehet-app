import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { generateInvoicePDF, type InvoiceData } from '@/lib/pdf/invoice-template'
import { getNextInvoiceNumber } from '@/lib/invoice-number'
import { generateEpcQrDataUrl } from '@/lib/pdf/epc-qr'

async function getCallerClub() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('club_id, active_club_id, role').eq('id', user.id).single()
  const p = data as { club_id: string; active_club_id: string | null; role: string } | null
  if (!p || !isBoardOrAbove(p.role)) return null
  return { clubId: p.active_club_id ?? p.club_id }
}

async function buildInvoiceData(admin: ReturnType<typeof createAdminClient>, clubId: string, payment: { id: string; description: string; amount_cents: number; due_date: string | null; reference_number: string | null }, recipient: { name: string; address?: string; postal?: string }, notes?: string): Promise<InvoiceData> {
  // Club info
  const { data: clubRaw } = await admin.from('clubs').select('name, business_id, street_address, postal_address, email, phone').eq('id', clubId).single()
  const club = clubRaw as { name: string; business_id: string | null; street_address: string | null; postal_address: string | null; email: string | null; phone: string | null } | null

  // Bank account
  const { data: bankRaw } = await admin.from('club_bank_accounts').select('iban, bic').eq('club_id', clubId).eq('is_default', true).maybeSingle()
  const bank = bankRaw as { iban: string; bic: string | null } | null

  // Invoice number
  const invoiceNumber = await getNextInvoiceNumber(clubId)

  const amountEur = payment.amount_cents / 100
  const today = new Date().toLocaleDateString('fi-FI')
  const dueDate = payment.due_date ? new Date(payment.due_date).toLocaleDateString('fi-FI') : today

  return {
    issuer_name: club?.name ?? 'Metsästysseura',
    issuer_address: club?.street_address ?? undefined,
    issuer_postal: club?.postal_address ?? undefined,
    issuer_email: club?.email ?? undefined,
    issuer_phone: club?.phone ?? undefined,
    issuer_business_id: club?.business_id ?? undefined,
    recipient_name: recipient.name,
    recipient_address: recipient.address,
    recipient_postal: recipient.postal,
    invoice_number: invoiceNumber,
    invoice_date: today,
    due_date: dueDate,
    reference_number: payment.reference_number ?? invoiceNumber,
    bank_iban: bank?.iban,
    bank_bic: bank?.bic ?? undefined,
    rows: [{ description: payment.description, quantity: 1, unit_price: amountEur, vat_percent: 0, total: amountEur }],
    subtotal: amountEur,
    vat_total: 0,
    total: amountEur,
    notes: notes ?? '14 päivän maksuehto. Kiitos!',
  }
}

// POST — send PDF invoice via email
export async function POST(req: NextRequest) {
  const caller = await getCallerClub()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as {
    payment_id: string
    recipient_email: string
    recipient_name?: string
    recipient_address?: string
    recipient_postal?: string
    notes?: string
  }

  const admin = createAdminClient()

  // Fetch payment
  const { data: paymentRaw } = await admin.from('payments').select('id, description, amount_cents, due_date, reference_number, club_id').eq('id', body.payment_id).eq('club_id', caller.clubId).single()
  if (!paymentRaw) return NextResponse.json({ error: 'Maksua ei löydy' }, { status: 404 })
  const payment = paymentRaw as { id: string; description: string; amount_cents: number; due_date: string | null; reference_number: string | null; club_id: string }

  const invoiceData = await buildInvoiceData(admin, caller.clubId, payment, { name: body.recipient_name ?? 'Jäsen', address: body.recipient_address, postal: body.recipient_postal }, body.notes)

  // Generate EPC QR code if bank details available
  if (invoiceData.bank_iban && invoiceData.bank_bic && invoiceData.total > 0) {
    try {
      invoiceData.qrCodeDataUrl = await generateEpcQrDataUrl({
        recipientName: invoiceData.issuer_name,
        iban: invoiceData.bank_iban,
        bic: invoiceData.bank_bic,
        amount: invoiceData.total,
        reference: invoiceData.reference_number,
      })
    } catch (e) {
      console.error('QR generation failed:', e)
    }
  }

  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(invoiceData)

  // Send email with PDF
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

  const resend = new Resend(apiKey)
  const amountEur = (payment.amount_cents / 100).toFixed(2).replace('.', ',')

  const { error: sendError } = await resend.emails.send({
    from: 'JahtiPro <info@jahtipro.fi>',
    to: body.recipient_email,
    subject: `Lasku — ${invoiceData.issuer_name} — ${invoiceData.invoice_number}`,
    html: `<p>Hei ${body.recipient_name ?? ''},</p>
<p>Liitteenä lasku seuraltanne ${invoiceData.issuer_name}.</p>
<p><strong>Summa:</strong> ${amountEur} €<br/>
<strong>Eräpäivä:</strong> ${invoiceData.due_date}<br/>
<strong>Viitenumero:</strong> ${invoiceData.reference_number}</p>
<p style="font-size:12px;color:#6b7280;">Laskulle on lisätty QR-koodi helpottamaan maksamista. Skannaa koodi pankkisovelluksellasi — maksutiedot täyttyvät automaattisesti.</p>
<p>Terveisin,<br/>${invoiceData.issuer_name}</p>`,
    attachments: [{
      filename: `lasku-${invoiceData.invoice_number}.pdf`,
      content: pdfBuffer.toString('base64'),
      contentType: 'application/pdf',
    }],
  })

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 })

  // Update payment sent_at
  await admin.from('payments').update({ sent_at: new Date().toISOString() }).eq('id', payment.id)

  return NextResponse.json({ success: true, invoice_number: invoiceData.invoice_number })
}
