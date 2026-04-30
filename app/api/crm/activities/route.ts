import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperAdmin } from '@/lib/auth'

async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isSuperAdmin((data as { role: string } | null)?.role)) return null
  return user.id
}

export async function GET() {
  if (!(await checkSuperAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_activities')
    .select('*, crm_contacts(name, club_name)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activities: data ?? [] })
}

export async function POST(req: NextRequest) {
  const userId = await checkSuperAdmin()
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = (await req.json()) as Record<string, unknown>
  const admin = createAdminClient()
  const { data, error } = await admin.from('crm_activities').insert({
    contact_id: body.contact_id as string,
    type: (body.type as string) || 'note',
    subject: (body.subject as string)?.trim() || null,
    body: (body.body as string)?.trim() || null,
    direction: (body.direction as string) || null,
    created_by: userId,
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activity: data })
}
