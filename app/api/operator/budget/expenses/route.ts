import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifySuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return (data as { role: string } | null)?.role === 'superadmin'
}

export async function POST(req: NextRequest) {
  if (!(await verifySuperadmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = (await req.json()) as Record<string, unknown>
  const admin = createAdminClient()
  const { error } = await admin.from('budget_expenses').insert({
    name: body.name ?? '',
    category: body.category ?? 'muu',
    amount_cents: body.amount_cents ?? 0,
    recurring: body.recurring ?? 'kertaluonteinen',
    month: body.month ?? new Date().toISOString().slice(0, 10),
    notes: body.notes ?? null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
