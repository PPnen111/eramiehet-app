import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateReferenceNumber } from '@/lib/utils/reference-number'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: payments } = await admin
    .from('payments')
    .select('id')
    .or('reference_number.is.null,reference_number.eq.')

  let fixed = 0
  for (const p of (payments ?? []) as { id: string }[]) {
    await admin.from('payments').update({ reference_number: generateReferenceNumber() }).eq('id', p.id)
    fixed++
  }

  return NextResponse.json({ ok: true, fixed })
}
