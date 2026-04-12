import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

async function getCallerClub() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('club_id, active_club_id, role').eq('id', user.id).single()
  const p = data as { club_id: string; active_club_id: string | null; role: string } | null
  if (!p || !isBoardOrAbove(p.role)) return null
  return { clubId: p.active_club_id ?? p.club_id }
}

export async function GET() {
  const caller = await getCallerClub()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { data } = await admin.from('club_bank_accounts').select('*').eq('club_id', caller.clubId).order('is_default', { ascending: false })
  return NextResponse.json({ accounts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const caller = await getCallerClub()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = (await req.json()) as Record<string, unknown>
  const admin = createAdminClient()

  // If setting as default, unset others first
  if (body.is_default === true) {
    await admin.from('club_bank_accounts').update({ is_default: false }).eq('club_id', caller.clubId)
  }

  const { error } = await admin.from('club_bank_accounts').insert({
    club_id: caller.clubId,
    account_name: body.account_name ?? '',
    iban: body.iban ?? '',
    bic: body.bic ?? null,
    is_default: body.is_default === true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
