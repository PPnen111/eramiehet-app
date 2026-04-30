import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isSuperAdmin((p as { role: string } | null)?.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as { to_email: string; subject: string; body: string; contact_id?: string }
  if (!body.to_email || !body.subject || !body.body) {
    return NextResponse.json({ error: 'Täytä kaikki kentät' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 })

  const resend = new Resend(apiKey)
  const { error: sendError } = await resend.emails.send({
    from: 'JahtiPro <info@jahtipro.fi>',
    to: body.to_email,
    subject: body.subject,
    html: body.body.replace(/\n/g, '<br/>'),
  })

  const admin = createAdminClient()

  await admin.from('email_sends').insert({
    contact_id: body.contact_id || null,
    to_email: body.to_email,
    subject: body.subject,
    status: sendError ? 'failed' : 'sent',
    sent_at: sendError ? null : new Date().toISOString(),
  })

  if (body.contact_id) {
    await admin.from('crm_activities').insert({
      contact_id: body.contact_id,
      type: 'email',
      subject: body.subject,
      body: body.body.slice(0, 500),
      direction: 'outbound',
      created_by: user.id,
    })
  }

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
