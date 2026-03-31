import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isDevAccess(role: string | null | undefined): boolean {
  return role === 'superadmin' || role === 'dev_partner'
}

export async function GET() {
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
    .from('dev_tasks')
    .select(`
      id, title, description, status, priority, category, created_at,
      profiles!dev_tasks_created_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get comment counts
  const taskIds = ((data ?? []) as unknown[]).map((t) => (t as { id: string }).id)
  let commentCounts: Record<string, number> = {}
  if (taskIds.length > 0) {
    const { data: counts } = await admin
      .from('dev_comments')
      .select('task_id')
      .in('task_id', taskIds)
    for (const row of (counts ?? []) as { task_id: string }[]) {
      commentCounts[row.task_id] = (commentCounts[row.task_id] ?? 0) + 1
    }
  }

  const tasks = ((data ?? []) as unknown[]).map((t) => {
    const task = t as {
      id: string
      title: string
      description: string | null
      status: string
      priority: string
      category: string | null
      created_at: string
      profiles: { full_name: string | null } | null
    }
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      created_at: task.created_at,
      created_by_name: task.profiles?.full_name ?? null,
      comment_count: commentCounts[task.id] ?? 0,
    }
  })

  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
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
    title: string
    description?: string
    category?: string
    priority?: string
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Otsikko vaaditaan' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dev_tasks')
    .insert({
      title: body.title.trim(),
      description: body.description?.trim() || null,
      category: body.category ?? 'yleinen',
      priority: body.priority ?? 'normaali',
      status: 'idea',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: (data as { id: string }).id })
}
