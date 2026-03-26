import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ ok: true })

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('club_id')
      .eq('id', user.id)
      .single()

    const clubId = (profileRaw as { club_id: string | null } | null)?.club_id ?? null

    const body = await request.json() as unknown
    const { event_type, page, metadata } = body as {
      event_type?: string
      page?: string
      metadata?: unknown
    }

    if (!event_type) return NextResponse.json({ ok: true })

    const admin = createAdminClient()
    await admin.from('activity_log').insert({
      profile_id: user.id,
      club_id: clubId,
      event_type,
      page: page ?? null,
      metadata: metadata ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Never block the UI — always return success
    return NextResponse.json({ ok: true })
  }
}
