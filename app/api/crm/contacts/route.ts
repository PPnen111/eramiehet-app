import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperAdmin } from '@/lib/auth'

async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (data as { role: string } | null)?.role
  if (!isSuperAdmin(role)) return null
  return user.id
}

export async function GET() {
  if (!(await checkSuperAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_contacts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contacts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const userId = await checkSuperAdmin()
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as Record<string, unknown>
  const admin = createAdminClient()
  const { data, error } = await admin.from('crm_contacts').insert({
    name: (body.name as string)?.trim() ?? '',
    email: (body.email as string)?.trim() || null,
    phone: (body.phone as string)?.trim() || null,
    role: (body.role as string) || null,
    club_name: (body.club_name as string)?.trim() || null,
    club_id: (body.club_id as string) || null,
    status: (body.status as string) || 'lead',
    source: (body.source as string) || null,
    notes: (body.notes as string)?.trim() || null,
    next_action: (body.next_action as string)?.trim() || null,
    next_action_date: (body.next_action_date as string) || null,
  }).select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact: data })
}
