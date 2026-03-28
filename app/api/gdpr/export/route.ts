import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Log the export request
  await admin.from('gdpr_requests').insert({
    profile_id: user.id,
    request_type: 'export',
    status: 'completed',
    completed_at: new Date().toISOString(),
  })

  // Fetch all user data in parallel
  const [
    { data: profile },
    { data: saalis },
    { data: bookings },
    { data: payments },
    { data: activityLog },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin.from('saalis').select('*').eq('profile_id', user.id),
    admin.from('bookings').select('*').eq('profile_id', user.id),
    admin.from('payments').select('*').eq('profile_id', user.id),
    admin
      .from('activity_log')
      .select('event_type, page, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    },
    profile: profile ?? null,
    saalis: saalis ?? [],
    bookings: bookings ?? [],
    payments: payments ?? [],
    activity_log: activityLog ?? [],
  }

  const date = new Date().toISOString().slice(0, 10)
  const filename = `omat-tiedot-${date}.json`

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
