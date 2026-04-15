import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { generateReferenceNumber } from '@/lib/utils/reference-number'

// Create a payment row for a registry member — returns payment_id.
// Does NOT send any email. Caller decides whether to send PDF or open print view.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('club_id, active_club_id, role').eq('id', user.id).single()
  const profile = profileRaw as { club_id: string; active_club_id: string | null; role: string } | null
  if (!profile || !isBoardOrAbove(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const clubId = profile.active_club_id ?? profile.club_id

  const admin = createAdminClient()

  // Verify the registry member exists and belongs to this club
  const { data: regRaw } = await admin
    .from('member_registry')
    .select('id, full_name, email, billing_method')
    .eq('id', id)
    .eq('club_id', clubId)
    .maybeSingle()
  const registry = regRaw as { id: string; full_name: string | null; email: string | null; billing_method: string | null } | null
  if (!registry) return NextResponse.json({ error: 'Jäsentä ei löydy' }, { status: 404 })

  const body = (await req.json()) as {
    description: string
    amount_cents: number
    due_date?: string
    reference_number?: string
    notes?: string
  }

  const { data: payRow, error } = await admin.from('payments').insert({
    club_id: clubId,
    registry_member_id: registry.id,
    description: body.description,
    amount_cents: body.amount_cents,
    due_date: body.due_date ?? null,
    status: 'pending',
    payment_type: 'jäsenmaksu',
    reference_number: body.reference_number?.trim() || generateReferenceNumber(),
    additional_info: body.notes ?? null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Determine delivery mode
  const billing = (registry.billing_method ?? '').toLowerCase().trim()
  const hasEmail = !!registry.email
  const isKirje = billing === 'kirje' || billing === 'paperilasku' || billing === 'posti'
  const deliveryMode: 'email' | 'print' = isKirje || !hasEmail ? 'print' : 'email'

  return NextResponse.json({
    ok: true,
    payment_id: (payRow as { id: string }).id,
    delivery_mode: deliveryMode,
    member_email: registry.email,
  })
}
