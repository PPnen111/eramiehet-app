import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isDevAccess(role: string | null | undefined): boolean {
  return role === 'superadmin' || role === 'dev_partner'
}

export async function GET(
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

  if (!isDevAccess((profile as { role: string } | null)?.role)) {
    return NextResponse.json({ error: 'Ei käyttöoikeutta' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dev_task_comments')
    .select('id, message, created_at, profiles(full_name)')
    .eq('task_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const comments = ((data ?? []) as unknown[]).map((c) => {
    const row = c as {
      id: string
      message: string
      created_at: string
      profiles: { full_name: string | null } | null
    }
    return {
      id: row.id,
      message: row.message,
      created_at: row.created_at,
      author_name: row.profiles?.full_name ?? 'Tuntematon',
    }
  })

  return NextResponse.json({ comments })
}

export async function POST(
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

  const body = (await req.json()) as { message: string }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'Viesti vaaditaan' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('dev_task_comments').insert({
    task_id: id,
    profile_id: user.id,
    message: body.message.trim(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
