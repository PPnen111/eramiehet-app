import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
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

  if (profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const body = await request.json() as unknown
  const userId = (body as { user_id?: string })?.user_id

  if (!userId) return NextResponse.json({ error: 'Puuttuva user_id' }, { status: 400 })

  if (userId === user.id) {
    return NextResponse.json({ error: 'Et voi poistaa omaa tiliäsi' }, { status: 400 })
  }

  // Block deletion of superadmin accounts
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if ((targetProfile as { role: string } | null)?.role === 'superadmin') {
    return NextResponse.json({ error: 'Superadmin-tiliä ei voi poistaa' }, { status: 400 })
  }

  // Delete profile row
  await admin.from('profiles').delete().eq('id', userId)

  // Delete auth user
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    console.error('deleteUser error:', error)
    return NextResponse.json({ error: 'Poistaminen epäonnistui: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
