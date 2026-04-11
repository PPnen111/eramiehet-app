import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifySuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((data as { role: string } | null)?.role !== 'superadmin') return null
  return user
}

export async function GET() {
  if (!(await verifySuperadmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const admin = createAdminClient()
  const { data } = await admin
    .from('sales_pipeline')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({ entries: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!(await verifySuperadmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('sales_pipeline')
    .insert({
      club_name: body.club_name ?? '',
      contact_name: body.contact_name ?? null,
      contact_email: body.contact_email ?? null,
      contact_phone: body.contact_phone ?? null,
      status: body.status ?? 'lead',
      source: body.source ?? null,
      estimated_members: body.estimated_members ?? null,
      notes: body.notes ?? null,
      next_action: body.next_action ?? null,
      next_action_date: body.next_action_date ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: (data as { id: string }).id })
}
