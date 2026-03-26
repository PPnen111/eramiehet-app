import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Log the deletion request before deleting anything
  await admin.from('gdpr_requests').insert({
    profile_id: user.id,
    request_type: 'delete',
    status: 'completed',
    completed_at: new Date().toISOString(),
  })

  // Delete in dependency order
  await admin.from('activity_log').delete().eq('profile_id', user.id)
  await admin.from('feedback').delete().eq('profile_id', user.id)
  await admin.from('saalis').delete().eq('profile_id', user.id)
  await admin.from('bookings').delete().eq('profile_id', user.id)

  // Anonymize payments (keep for accounting, clear personal identifiers)
  await admin
    .from('payments')
    .update({ profile_id: null })
    .eq('profile_id', user.id)

  // Delete gdpr_requests (the one we just inserted will also be cleared)
  await admin.from('gdpr_requests').delete().eq('profile_id', user.id)

  // Delete profile
  await admin.from('profiles').delete().eq('id', user.id)

  // Delete auth user — must be last
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    return NextResponse.json({ error: 'Tilin poisto epäonnistui' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
