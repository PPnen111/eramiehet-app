import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

type ProfileRow = { club_id: string; active_club_id: string | null; role: string }

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
    .select('club_id, active_club_id, role')
    .eq('id', user.id)
    .single()

  const caller = profileRaw as ProfileRow | null
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }
  const clubId = caller.active_club_id ?? caller.club_id

  const admin = createAdminClient()

  // Verify payment exists and belongs to club
  const { data: paymentRaw } = await admin
    .from('payments')
    .select('id')
    .eq('id', id)
    .eq('club_id', clubId)
    .maybeSingle()

  if (!paymentRaw) return NextResponse.json({ error: 'Laskua ei löydy' }, { status: 404 })

  const { error } = await admin
    .from('payments')
    .delete()
    .eq('id', id)
    .eq('club_id', clubId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
