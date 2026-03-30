import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { welcomeHtml, welcomeSubject } from '@/lib/emails/welcome'

const FROM = 'JahtiPro <noreply@jahtipro.fi>'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('club_id, role, active_club_id')
    .eq('id', user.id)
    .single()

  const caller = callerRaw as {
    club_id: string
    role: string
    active_club_id: string | null
  } | null
  if (!caller || !isBoardOrAbove(caller.role)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }
  const clubId = caller.active_club_id ?? caller.club_id

  const admin = createAdminClient()

  // Fetch the member profile — ensure they belong to this club
  const { data: memberRaw } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', id)
    .eq('club_id', clubId)
    .maybeSingle()

  const member = memberRaw as { id: string; full_name: string | null; email: string | null } | null
  if (!member) return NextResponse.json({ error: 'Jäsentä ei löydy' }, { status: 404 })
  if (!member.email) {
    return NextResponse.json({ error: 'Jäsenellä ei ole sähköpostiosoitetta' }, { status: 400 })
  }

  // Fetch club name
  const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', clubId).single()
  const clubName = (clubRaw as { name: string | null } | null)?.name ?? 'Metsästysseura'

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Sähköpostipalvelu ei käytettävissä' }, { status: 500 })

  const resend = new Resend(apiKey)
  const { error: sendError } = await resend.emails.send({
    from: FROM,
    to: member.email,
    subject: welcomeSubject(),
    html: welcomeHtml({
      fullName: member.full_name ?? member.email,
      clubName,
      email: member.email,
    }),
  })

  if (sendError) {
    return NextResponse.json({ error: 'Sähköpostin lähetys epäonnistui' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
