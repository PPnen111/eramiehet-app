import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if ((profileRaw as { role: string } | null)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  const body = await request.json() as unknown
  const subscriptionId = (body as { subscription_id?: string })?.subscription_id
  if (!subscriptionId) {
    return NextResponse.json({ error: 'subscription_id puuttuu' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('subscriptions')
    .update({ status: 'active', activated_at: new Date().toISOString() })
    .eq('id', subscriptionId)

  if (error) {
    console.error('activate-subscription error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
