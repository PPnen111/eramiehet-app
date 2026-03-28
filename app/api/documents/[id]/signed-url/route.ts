import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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
  if (!p) return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })

  const { data: doc } = await admin
    .from('documents')
    .select('storage_path, club_id')
    .eq('id', id)
    .single()

  const d = doc as { storage_path: string; club_id: string } | null
  if (!d) return NextResponse.json({ error: 'Dokumenttia ei löydy' }, { status: 404 })

  if (p.role !== 'superadmin' && p.club_id !== d.club_id) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const { data: signed, error } = await admin.storage
    .from('documents')
    .createSignedUrl(d.storage_path, 3600)

  if (error || !signed) {
    return NextResponse.json({ error: error?.message ?? 'URL-luonti epäonnistui' }, { status: 500 })
  }

  const ext = d.storage_path.split('.').pop()?.toLowerCase() ?? ''
  const previewable = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)

  return NextResponse.json({ url: signed.signedUrl, ext, previewable })
}
