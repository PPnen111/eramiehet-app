import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isDevAccess(role: string | null | undefined): boolean {
  return role === 'superadmin' || role === 'dev_partner'
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isDevAccess((profile as { role: string } | null)?.role)) {
    return NextResponse.json({ error: 'Ei käyttöoikeutta' }, { status: 403 })
  }

  const body = (await req.json()) as {
    title?: string
    description?: string
    status?: string
    priority?: string
  }

  const patch: Record<string, string | null> = {}
  if (body.title !== undefined) patch.title = body.title.trim()
  if (body.description !== undefined) patch.description = body.description.trim() || null
  if (body.status !== undefined) patch.status = body.status
  if (body.priority !== undefined) patch.priority = body.priority

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Ei muutettavia kenttiä' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('dev_tasks').update(patch).eq('id', id)
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
  if (!user) return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Only superadmin can delete
  if ((profile as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Vain superadmin voi poistaa tehtäviä' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('dev_tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
