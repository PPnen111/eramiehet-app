import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DevTasksBoard from './dev-tasks-board'
import type { DevTask } from './dev-tasks-board'

export default async function KehitysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, full_name, dev_access')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { role: string | null; full_name: string | null; dev_access: boolean | null } | null
  const role = profile?.role ?? null
  const devAccess = profile?.dev_access ?? false

  if (role !== 'superadmin' && !devAccess) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()
  const { data: tasksRaw } = await admin
    .from('dev_tasks')
    .select(`
      id, title, description, status, priority, category, created_at,
      profiles!dev_tasks_created_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  const taskIds = ((tasksRaw ?? []) as unknown[]).map((t) => (t as { id: string }).id)
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

  const tasks: DevTask[] = ((tasksRaw ?? []) as unknown[]).map((t) => {
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
      category: task.category ?? 'yleinen',
      created_at: task.created_at,
      created_by_name: task.profiles?.full_name ?? null,
      comment_count: commentCounts[task.id] ?? 0,
    }
  })

  return <DevTasksBoard initialTasks={tasks} role={role ?? 'member'} />
}
