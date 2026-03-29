import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profileRaw || !isBoardOrAbove((profileRaw as { role: string }).role)) {
    return NextResponse.json({ error: 'Ei käyttöoikeutta' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('invitations')
    .delete()
    .eq('id', id)
    .eq('club_id', (profileRaw as { club_id: string }).club_id)

  if (error) {
    return NextResponse.json({ error: 'Kutsun poistaminen epäonnistui' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
