import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

type ProfileRow = { club_id: string; role: string }

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  const caller = profileRaw as ProfileRow | null
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Fetch payment to check status and club ownership
  const { data: paymentRaw } = await admin
    .from('payments')
    .select('status')
    .eq('id', id)
    .eq('club_id', caller.club_id)
    .maybeSingle()

  const payment = paymentRaw as { status: string } | null
  if (!payment) return NextResponse.json({ error: 'Laskua ei löydy' }, { status: 404 })
  if (payment.status !== 'pending') {
    return NextResponse.json({ error: 'Vain odottavat laskut voidaan poistaa' }, { status: 400 })
  }

  const { error } = await admin
    .from('payments')
    .delete()
    .eq('id', id)
    .eq('club_id', caller.club_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
