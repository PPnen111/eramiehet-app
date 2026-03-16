import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type InvitationRow = {
  id: string
  status: string
  expires_at: string
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || !('token' in body)) {
    return NextResponse.json({ error: 'Token puuttuu' }, { status: 400 })
  }

  const token = (body as Record<string, unknown>).token
  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'Virheellinen token' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: raw } = await admin
    .from('invitations')
    .select('id, status, expires_at')
    .eq('token', token)
    .single()

  if (!raw) {
    return NextResponse.json({ error: 'Kutsu ei löydy' }, { status: 404 })
  }

  const invitation = raw as unknown as InvitationRow

  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Kutsu ei ole enää voimassa' }, { status: 409 })
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Kutsu on vanhentunut' }, { status: 410 })
  }

  await admin
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  return NextResponse.json({ ok: true })
}
