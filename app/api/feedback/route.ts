import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ProfileRow = {
  club_id: string | null
  role: string | null
}

const VALID_STATUSES = ['uusi', 'luettu', 'hoidettu'] as const

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as unknown as ProfileRow | null

  const b = body as Record<string, unknown>
  const rating = typeof b.rating === 'number' ? Math.min(5, Math.max(1, Math.round(b.rating))) : null
  const category = typeof b.category === 'string' ? b.category : 'yleinen'
  const message = typeof b.message === 'string' ? b.message.trim() : ''
  const page = typeof b.page === 'string' ? b.page.slice(0, 200) : '/'

  if (message.length < 10) {
    return NextResponse.json({ error: 'Viesti on liian lyhyt (min 10 merkkiä)' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('feedback').insert({
    profile_id: user.id,
    club_id: profile?.club_id ?? null,
    page,
    rating,
    category,
    message,
    status: 'uusi',
  })

  if (error) {
    return NextResponse.json({ error: 'Tallennus epäonnistui' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  // Only superadmin can update feedback status
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profileRaw || (profileRaw as { role: string }).role !== 'superadmin') {
    return NextResponse.json({ error: 'Ei käyttöoikeutta' }, { status: 403 })
  }

  const b = body as Record<string, unknown>
  const id = typeof b.id === 'string' ? b.id : null
  const status = typeof b.status === 'string' ? b.status : null

  if (!id || !status) {
    return NextResponse.json({ error: 'id ja status vaaditaan' }, { status: 400 })
  }

  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Virheellinen status' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('feedback').update({ status }).eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Päivitys epäonnistui' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
