import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { generateReferenceNumber } from '@/lib/utils/reference-number'

type GuestPermit = {
  id: string
  club_id: string
  guest_name: string
  guest_email: string | null
  area: string | null
  valid_from: string | null
  valid_until: string | null
  price_cents: number | null
  payment_id: string | null
}

// Create a payment row for a guest permit. Returns payment_id and delivery_mode.
// If guest has email → delivery_mode = 'email', caller uses /api/invoice-pdf to send.
// If no email → delivery_mode = 'print', caller opens /api/invoice-pdf/preview in new tab.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, active_club_id, role')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as { club_id: string; active_club_id: string | null; role: string } | null
  if (!profile || !isBoardOrAbove(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const clubId = profile.active_club_id ?? profile.club_id

  const admin = createAdminClient()

  const { data: permitRaw } = await admin
    .from('guest_permits')
    .select('id, club_id, guest_name, guest_email, area, valid_from, valid_until, price_cents, payment_id')
    .eq('id', id)
    .eq('club_id', clubId)
    .maybeSingle()
  const permit = permitRaw as GuestPermit | null
  if (!permit) return NextResponse.json({ error: 'Lupaa ei löydy' }, { status: 404 })

  const body = (await req.json().catch(() => ({}))) as {
    description?: string
    amount_cents?: number
    due_date?: string
    reference_number?: string
    notes?: string
  }

  const amountCents = typeof body.amount_cents === 'number' ? body.amount_cents : (permit.price_cents ?? 0)
  if (amountCents <= 0) return NextResponse.json({ error: 'Tarkista summa' }, { status: 400 })

  const description = body.description?.trim()
    || `Vieraslupa — ${permit.guest_name}${permit.area ? ` (${permit.area})` : ''}`

  const { data: payRow, error } = await admin
    .from('payments')
    .insert({
      club_id: clubId,
      description,
      amount_cents: amountCents,
      due_date: body.due_date ?? null,
      status: 'pending',
      payment_type: 'vieraslupa',
      reference_number: body.reference_number?.trim() || generateReferenceNumber(),
      additional_info: body.notes ?? null,
    })
    .select('id')
    .single()

  if (error || !payRow) {
    return NextResponse.json({ error: error?.message ?? 'Laskun luonti epäonnistui' }, { status: 500 })
  }

  const paymentId = (payRow as { id: string }).id

  // Link permit to this payment (overwrite if previously linked)
  await admin.from('guest_permits').update({ payment_id: paymentId }).eq('id', permit.id)

  const deliveryMode: 'email' | 'print' = permit.guest_email ? 'email' : 'print'

  return NextResponse.json({
    ok: true,
    payment_id: paymentId,
    delivery_mode: deliveryMode,
    guest_email: permit.guest_email,
    guest_name: permit.guest_name,
  })
}
