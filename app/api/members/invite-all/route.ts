import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove } from '@/lib/auth'
import { welcomeHtml, welcomeSubject } from '@/lib/emails/welcome'
import { runConcurrent } from '@/lib/utils/concurrent'

const FROM = 'JahtiPro <noreply@jahtipro.fi>'

export async function POST(_req: NextRequest) {
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

  // Fetch all club members with email
  const { data: profilesRaw } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('club_id', clubId)
    .not('email', 'is', null)

  const profiles = (profilesRaw ?? []) as { id: string; full_name: string | null; email: string }[]
  if (profiles.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Determine which members have never logged in
  const profileIds = new Set(profiles.map((p) => p.id))
  const loginMap = new Map<string, boolean>()
  let page = 1
  while (true) {
    const { data: authData } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (!authData?.users?.length) break
    for (const u of authData.users) {
      if (profileIds.has(u.id)) {
        loginMap.set(u.id, !!u.last_sign_in_at)
      }
    }
    if (authData.users.length < 1000) break
    page++
  }

  const uninvited = profiles.filter((p) => !loginMap.get(p.id))
  if (uninvited.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Fetch club name once
  const { data: clubRaw } = await admin.from('clubs').select('name').eq('id', clubId).single()
  const clubName = (clubRaw as { name: string | null } | null)?.name ?? 'Metsästysseura'

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Sähköpostipalvelu ei käytettävissä' }, { status: 500 })

  const resend = new Resend(apiKey)
  let sent = 0

  await runConcurrent(
    uninvited,
    async (m) => {
      const { error } = await resend.emails.send({
        from: FROM,
        to: m.email,
        subject: welcomeSubject(),
        html: welcomeHtml({
          fullName: m.full_name ?? m.email,
          clubName,
          email: m.email,
        }),
      })
      if (!error) sent++
    },
    10
  )

  return NextResponse.json({ sent })
}
