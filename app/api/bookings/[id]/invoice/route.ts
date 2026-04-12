import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('club_id, active_club_id, role').eq('id', user.id).single()
  const profile = profileRaw as { club_id: string; active_club_id: string | null; role: string } | null
  if (!profile || !isBoardOrAbove(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const clubId = profile.active_club_id ?? profile.club_id

  const body = (await req.json()) as { booker_email: string; description: string; amount_cents: number; due_date: string }

  const admin = createAdminClient()

  // Get club name
  const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', clubId).single()
  const clubName = (clubRaw as { name: string } | null)?.name ?? 'Metsästysseura'

  // Create payment
  const { data: paymentRaw, error: payErr } = await admin.from('payments').insert({
    club_id: clubId,
    description: body.description,
    amount_cents: body.amount_cents,
    due_date: body.due_date,
    status: 'pending',
    payment_type: 'varausmaksu',
  }).select('id').single()

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })

  // Send invoice email
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey && body.booker_email) {
    const amountEur = (body.amount_cents / 100).toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'JahtiPro <info@jahtipro.fi>',
      to: body.booker_email,
      subject: `Lasku — varaus — ${clubName}`,
      html: `<h2 style="color:#166534">${clubName}</h2>
<p>Hei,</p>
<p>Tässä laskunne varauksen osalta.</p>
<table style="margin:16px 0;">
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Kuvaus:</td><td><strong>${body.description}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Summa:</td><td><strong>${amountEur}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Eräpäivä:</td><td><strong>${body.due_date}</strong></td></tr>
</table>
<p style="margin-top:24px;">Terveisin,<br/>${clubName}<br/>JahtiPro — info@jahtipro.fi</p>`.trim(),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, payment_id: (paymentRaw as { id: string }).id })
}
