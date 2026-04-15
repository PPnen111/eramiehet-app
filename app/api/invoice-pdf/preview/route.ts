import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { generateInvoicePDF, type InvoiceData } from '@/lib/pdf/invoice-template'
import { getNextInvoiceNumber } from '@/lib/invoice-number'
import { generateEpcQrDataUrl } from '@/lib/pdf/epc-qr'

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('payment_id')
  if (!paymentId) return new Response('payment_id required', { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('club_id, active_club_id, role').eq('id', user.id).single()
  const profile = profileRaw as { club_id: string; active_club_id: string | null; role: string } | null
  if (!profile || !isBoardOrAbove(profile.role)) return new Response('Forbidden', { status: 403 })
  const clubId = profile.active_club_id ?? profile.club_id

  const admin = createAdminClient()
  const { data: paymentRaw } = await admin.from('payments').select('id, description, amount_cents, due_date, reference_number').eq('id', paymentId).eq('club_id', clubId).single()
  if (!paymentRaw) return new Response('Not found', { status: 404 })
  const payment = paymentRaw as { id: string; description: string; amount_cents: number; due_date: string | null; reference_number: string | null }

  // Club info
  const { data: clubRaw } = await admin.from('clubs').select('name, business_id, street_address, postal_address, email, phone').eq('id', clubId).single()
  const club = clubRaw as { name: string; business_id: string | null; street_address: string | null; postal_address: string | null; email: string | null; phone: string | null } | null

  const { data: bankRaw } = await admin.from('club_bank_accounts').select('iban, bic').eq('club_id', clubId).eq('is_default', true).maybeSingle()
  const bank = bankRaw as { iban: string; bic: string | null } | null

  const invoiceNumber = await getNextInvoiceNumber(clubId)
  const amountEur = payment.amount_cents / 100
  const today = new Date().toLocaleDateString('fi-FI')
  const dueDate = payment.due_date ? new Date(payment.due_date).toLocaleDateString('fi-FI') : today

  const data: InvoiceData = {
    issuer_name: club?.name ?? 'Metsästysseura',
    issuer_address: club?.street_address ?? undefined,
    issuer_postal: club?.postal_address ?? undefined,
    issuer_email: club?.email ?? undefined,
    issuer_phone: club?.phone ?? undefined,
    issuer_business_id: club?.business_id ?? undefined,
    recipient_name: 'Jäsen',
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
    notes: '14 päivän maksuehto.',
  }

  // Generate EPC QR code if bank details available
  if (data.bank_iban && data.bank_bic && data.total > 0) {
    try {
      data.qrCodeDataUrl = await generateEpcQrDataUrl({
        recipientName: data.issuer_name,
        iban: data.bank_iban,
        bic: data.bank_bic,
        amount: data.total,
        reference: data.reference_number,
      })
    } catch (e) {
      console.error('QR generation failed:', e)
    }
  }

  const pdfBuffer = await generateInvoicePDF(data)

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="lasku-${invoiceNumber}.pdf"`,
    },
  })
}
