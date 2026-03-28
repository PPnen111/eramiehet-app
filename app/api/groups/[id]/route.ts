import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminOrAbove } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminOrAbove((profile as { role: string } | null)?.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const body = await req.json() as unknown
  const { name, description } = body as { name?: string; description?: string }

  const update: Record<string, string | null> = {}
  if (name !== undefined) update.name = name.trim()
  if (description !== undefined) update.description = description?.trim() || null

  const { error } = await admin
    .from('club_groups')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminOrAbove((profile as { role: string } | null)?.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  // Delete members first, then the group
  await admin.from('club_group_members').delete().eq('group_id', id)
  const { error } = await admin.from('club_groups').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
