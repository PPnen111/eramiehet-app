import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  const p = profile as { club_id: string | null; role: string | null } | null
  const allowedRoles = ['admin', 'board_member', 'superadmin']
  if (!p || !allowedRoles.includes(p.role ?? '')) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const body = await request.json() as unknown
  const { doc_id, storage_path, club_id } = body as {
    doc_id?: string
    storage_path?: string
    club_id?: string
  }

  if (!doc_id || !storage_path || !club_id) {
    return NextResponse.json({ error: 'Puuttuvia kenttiä' }, { status: 400 })
  }

  if (p.role !== 'superadmin' && p.club_id !== club_id) {
    return NextResponse.json({ error: 'Ei oikeuksia tähän seuraan' }, { status: 403 })
  }

  await admin.storage.from('documents').remove([storage_path])

  const { error: dbError } = await admin
    .from('documents')
    .delete()
    .eq('id', doc_id)
    .eq('club_id', club_id)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
