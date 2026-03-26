import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type SubscriptionRow = {
  status: string
  trial_ends_at: string | null
}

function daysUntil(iso: string): number {
  const now = new Date()
  const end = new Date(iso)
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function TrialBanner() {
  // Check for preview mode cookie — don't show banner during role preview
  const cookieStore = await cookies()
  const previewRole = cookieStore.get('preview_role')?.value
  if (previewRole) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { club_id: string | null; role: string | null } | null
  if (!profile?.club_id) return null
  // Superadmins don't have a trial
  if (profile.role === 'superadmin') return null

  const admin = createAdminClient()
  let sub: SubscriptionRow | null = null
  try {
    const { data: subRaw } = await admin
      .from('subscriptions')
      .select('status, trial_ends_at')
      .eq('club_id', profile.club_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    sub = subRaw as SubscriptionRow | null
  } catch {
    return null
  }
  if (!sub) return null
  if (sub.status === 'active') return null

  const isExpired = sub.status === 'expired' || (sub.trial_ends_at ? daysUntil(sub.trial_ends_at) <= 0 : false)
  const daysLeft = sub.trial_ends_at ? daysUntil(sub.trial_ends_at) : null
  const isWarning = !isExpired && daysLeft !== null && daysLeft <= 7

  if (!isExpired && !isWarning) return null

  return (
    <div
      className={`w-full px-4 py-2.5 text-center text-sm font-medium ${
        isExpired
          ? 'bg-red-700 text-white'
          : 'bg-amber-400 text-amber-950'
      }`}
    >
      {isExpired ? (
        <>
          Kokeilujakso on päättynyt.{' '}
          <Link href="/tilaus" className="underline font-bold hover:opacity-80">
            Aktivoi tilaus
          </Link>{' '}
          jatkaaksesi käyttöä.
        </>
      ) : (
        <>
          Kokeilujaksoa jäljellä <strong>{daysLeft} päivää</strong>.{' '}
          <Link href="/tilaus" className="underline font-bold hover:opacity-80">
            Katso tilausvaihtoehdot →
          </Link>
        </>
      )}
    </div>
  )
}
