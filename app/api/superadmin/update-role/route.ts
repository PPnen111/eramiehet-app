import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const body = await request.json() as unknown
  const { user_id, role } = body as { user_id?: string; role?: string }

  if (!user_id || !role) {
    return NextResponse.json({ error: 'Puuttuva user_id tai role' }, { status: 400 })
  }

  const validRoles = ['member', 'board_member', 'admin']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Virheellinen rooli' }, { status: 400 })
  }

  // Block changing own role or another superadmin's role
  if (user_id === user.id) {
    return NextResponse.json({ error: 'Et voi muuttaa omaa rooliasi' }, { status: 400 })
  }

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user_id)
    .single()

  if ((targetProfile as { role: string } | null)?.role === 'superadmin') {
    return NextResponse.json({ error: 'Superadmin-roolia ei voi muuttaa' }, { status: 400 })
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', user_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
