import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isDevAccess(role: string | null | undefined, devAccess: boolean | null | undefined): boolean {
  return role === 'superadmin' || devAccess === true
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kirjautuminen vaaditaan' }, { status: 401 })

  // Use admin client for profile read — dev_access users may lack club_id,
  // which causes SSR-client RLS to block the select and return null.
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, dev_access')
    .eq('id', user.id)
    .single()

  const p = profile as { role: string; dev_access: boolean | null } | null
  if (!isDevAccess(p?.role, p?.dev_access)) {
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

  const { error } = await admin.from('dev_tasks').update(patch).eq('id', id)
  if (error) {
    console.error('Dev task update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Only superadmin can delete
  if ((profile as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Vain superadmin voi poistaa tehtäviä' }, { status: 403 })
  }

  const { error } = await admin.from('dev_tasks').delete().eq('id', id)
  if (error) {
    console.error('Dev task delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
