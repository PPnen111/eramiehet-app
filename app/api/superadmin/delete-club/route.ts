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
  const clubId = (body as { club_id?: string })?.club_id

  if (!clubId) return NextResponse.json({ error: 'Puuttuva club_id' }, { status: 400 })

  // Block deletion if club has members
  const { data: members } = await admin
    .from('profiles')
    .select('id')
    .eq('club_id', clubId)

  if (members && members.length > 0) {
    return NextResponse.json({ error: 'Poista ensin kaikki jäsenet' }, { status: 400 })
  }

  // Call RPC via the regular client so auth.uid() is set inside the function
  const { error } = await supabase.rpc('delete_club', { p_club_id: clubId })

  if (error) {
    console.error('delete_club error:', error)
    return NextResponse.json({ error: 'Poistaminen epäonnistui: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
