import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PrintButton from './print-button'

const roleLabel: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Hallituksen jäsen',
  member: 'Jäsen',
}

type ProfileRow = {
  id: string
  full_name: string | null
  role: string
  member_status: string
  join_date: string | null
  club_id: string
}

type ClubRow = {
  name: string | null
}

function formatJoinDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function JasenkorttPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, full_name, role, member_status, join_date, club_id')
    .eq('id', user.id)
    .single()

  if (!profileRaw) redirect('/login')
  const profile = profileRaw as unknown as ProfileRow

  // Fetch club name via admin client (bypasses RLS on clubs table)
  const admin = createAdminClient()
  const { data: clubRaw } = await admin
    .from('clubs')
    .select('name')
    .eq('id', profile.club_id)
    .single()

  const clubName =
    clubRaw ? (clubRaw as unknown as ClubRow).name ?? 'Metsästysseura' : 'Metsästysseura'

  const memberId = profile.id.replace(/-/g, '').slice(0, 8).toUpperCase()
  const isActive = profile.member_status === 'active'

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8 print:bg-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/jasenet" className="text-sm text-green-400 hover:text-green-300">
            ← Takaisin
          </Link>
          <PrintButton />
        </div>

        <h1 className="text-xl font-bold text-white print:hidden">Jäsenkortti</h1>

        {/* Physical-style membership card — landscape */}
        <div
          className="
            mx-auto w-full max-w-sm
            rounded-2xl bg-gradient-to-br from-green-900 to-green-950
            p-5 shadow-2xl ring-1 ring-green-700/50
            print:max-w-none print:rounded-none print:shadow-none
          "
          style={{ minHeight: '180px' }}
        >
          {/* Top row: club name + status */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-500">
                Jäsenkortti
              </p>
              <p className="mt-0.5 text-sm font-bold text-white">{clubName}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isActive
                  ? 'bg-green-700 text-green-100'
                  : 'bg-stone-700 text-stone-300'
              }`}
            >
              {isActive ? 'Aktiivinen' : 'Ei aktiivinen'}
            </span>
          </div>

          {/* Member name */}
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-widest text-green-500">Jäsen</p>
            <p className="mt-0.5 text-xl font-bold tracking-wide text-white">
              {profile.full_name ?? '—'}
            </p>
          </div>

          {/* Bottom row: role, joined, id */}
          <div className="mt-5 flex items-end justify-between gap-4">
            <div className="space-y-1">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-green-500">Rooli</p>
                <p className="text-sm font-medium text-green-200">
                  {roleLabel[profile.role] ?? profile.role}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-green-500">Liittynyt</p>
                <p className="text-sm font-medium text-green-200">
                  {formatJoinDate(profile.join_date)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-green-500">Jäsen-ID</p>
              <p className="font-mono text-sm font-semibold text-green-300">{memberId}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
