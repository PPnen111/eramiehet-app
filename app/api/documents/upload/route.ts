import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
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

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const name = formData.get('name') as string | null
  const category = formData.get('category') as string | null
  const clubId = formData.get('club_id') as string | null

  if (!file || !name || !category || !clubId) {
    return NextResponse.json({ error: 'Puuttuvia kenttiä' }, { status: 400 })
  }

  if (p.role !== 'superadmin' && p.club_id !== clubId) {
    return NextResponse.json({ error: 'Ei oikeuksia tähän seuraan' }, { status: 403 })
  }

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ]
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Sallitut tiedostotyypit: PDF, Word, JPG, PNG.' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Tiedosto on liian suuri. Maksimikoko on 10 MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${clubId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: storageError } = await admin.storage
    .from('documents')
    .upload(path, buffer, { contentType: file.type })

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 })
  }

  const { error: dbError } = await admin.from('documents').insert({
    club_id: clubId,
    name,
    category,
    storage_path: path,
    uploaded_by: user.id,
  })

  if (dbError) {
    await admin.storage.from('documents').remove([path])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, path })
}
