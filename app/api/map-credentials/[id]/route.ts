import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

type ProfileRow = { club_id: string; role: string }

async function getCallerProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  return data as ProfileRow | null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const caller = await getCallerProfile(supabase)

  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const patch: Record<string, string | null> = {}
  if (typeof b.name === 'string') patch.name = b.name.trim() || null
  if ('url' in b) patch.url = typeof b.url === 'string' ? b.url.trim() || null : null
  if ('username' in b) patch.username = typeof b.username === 'string' ? b.username.trim() || null : null
  if ('password' in b) patch.password = typeof b.password === 'string' ? b.password.trim() || null : null
  if ('description' in b) patch.description = typeof b.description === 'string' ? b.description.trim() || null : null

  if (!patch.name) return NextResponse.json({ error: 'Nimi vaaditaan' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('map_credentials')
    .update(patch)
    .eq('id', id)
    .eq('club_id', caller.club_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const caller = await getCallerProfile(supabase)

  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('map_credentials')
    .delete()
    .eq('id', id)
    .eq('club_id', caller.club_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
