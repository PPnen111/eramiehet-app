import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ClubRow = {
  id: string
  name: string | null
  created_at: string
}

type ProfileRow = {
  club_id: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

export default async function SuperadminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profileRaw || (profileRaw as { role: string }).role !== 'superadmin') {
    redirect('/dashboard')
  }

  const admin = createAdminClient()

  // Fetch all clubs and all profiles in parallel
  const [{ data: clubsRaw }, { data: profilesRaw }] = await Promise.all([
    admin.from('clubs').select('id, name, created_at').order('created_at', { ascending: false }),
    admin.from('profiles').select('club_id'),
  ])

  const clubs = (clubsRaw ?? []) as unknown as ClubRow[]
  const profiles = (profilesRaw ?? []) as unknown as ProfileRow[]

  // Build member count map
  const memberCountByClub = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.club_id] = (acc[p.club_id] ?? 0) + 1
    return acc
  }, {})

  const totalClubs = clubs.length
  const totalUsers = profiles.length

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-green-500">
            Superadmin
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Hallintapaneeli</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <p className="text-xs text-green-500">Seuroja yhteensä</p>
            <p className="mt-1 text-3xl font-bold text-white">{totalClubs}</p>
          </div>
          <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <p className="text-xs text-green-500">Käyttäjiä yhteensä</p>
            <p className="mt-1 text-3xl font-bold text-white">{totalUsers}</p>
          </div>
        </div>

        {/* Clubs list */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
            Seurat
          </h2>
          {clubs.length === 0 ? (
            <p className="text-sm text-green-600">Ei seuroja.</p>
          ) : (
            <div className="space-y-2">
              {clubs.map((club) => (
                <div
                  key={club.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-green-800 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{club.name ?? '—'}</p>
                    <p className="text-xs text-green-600">Perustettu {formatDate(club.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {memberCountByClub[club.id] ?? 0}
                    </p>
                    <p className="text-xs text-green-600">jäsentä</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
