import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperAdmin } from '@/lib/auth'

async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return isSuperAdmin((data as { role: string } | null)?.role)
}

export async function GET() {
  if (!(await checkSuperAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('email_sequences').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sequences: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  if (!(await checkSuperAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = (await req.json()) as { id: string } & Record<string, unknown>
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { id, ...updates } = body
  const admin = createAdminClient()
  const { error } = await admin.from('email_sequences').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
