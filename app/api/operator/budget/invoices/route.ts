import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifySuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return (data as { role: string } | null)?.role === 'superadmin'
}

export async function GET() {
  if (!(await verifySuperadmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { data } = await admin.from('jahtipro_invoices').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ invoices: data ?? [] })
}

const PLAN_LABELS: Record<string, string> = { start: 'Jahti Start', plus: 'Jahti Plus', pro: 'Jahti Pro' }

export async function POST(req: NextRequest) {
  if (!(await verifySuperadmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = (await req.json()) as Record<string, unknown>
  const admin = createAdminClient()

  const plan = (body.plan as string) ?? 'start'
  const planLabel = PLAN_LABELS[plan] ?? plan
  const amountCents = (body.amount_cents as number) ?? 0
  const dueDate = (body.due_date as string) ?? new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  const billingEmail = (body.billing_email as string) ?? null

  const { data, error } = await admin.from('jahtipro_invoices').insert({
    club_id: body.club_id,
    plan,
    plan_label: planLabel,
    amount_cents: amountCents,
    billing_period_start: body.billing_period_start ?? null,
    billing_period_end: body.billing_period_end ?? null,
    due_date: dueDate,
    billing_email: billingEmail,
    billing_name: body.billing_name ?? null,
    status: 'pending',
    notes: body.notes ?? null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send email if billing_email provided
  if (billingEmail && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const amountEur = (amountCents / 100).toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })
    await resend.emails.send({
      from: 'JahtiPro <noreply@jahtipro.fi>',
      to: billingEmail,
      subject: `JahtiPro — lasku ${planLabel} ${new Date().getFullYear()}`,
      html: `<h2 style="color:#166534">JahtiPro</h2>
<p>Hei,</p>
<p>Tässä laskunne JahtiPro-palvelusta.</p>
<table style="margin:16px 0;">
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Paketti:</td><td><strong>${planLabel}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Summa:</td><td><strong>${amountEur}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Eräpäivä:</td><td><strong>${dueDate}</strong></td></tr>
</table>
<p>Palvelu on käytössänne välittömästi.</p>
<p>Lisätietoja: <a href="mailto:info@jahtipro.fi">info@jahtipro.fi</a></p>
<p style="margin-top:24px;">Terveisin,<br/>JahtiPro-tiimi</p>`.trim(),
    }).catch(() => {})

    await admin.from('jahtipro_invoices').update({ sent_at: new Date().toISOString() }).eq('id', (data as { id: string }).id)
  }

  return NextResponse.json({ ok: true, id: (data as { id: string }).id })
}
