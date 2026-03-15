import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './logout-button'

const modules = [
  {
    title: 'Tapahtumat',
    description: 'Talkoot, kokoukset, jahdit ja harjoitukset.',
    href: '/tapahtumat',
    icon: '📅',
  },
  {
    title: 'Metsästäjille',
    description: 'Säännöt, pöytäkirjat ja ohjeet.',
    href: '/dokumentit',
    icon: '📋',
  },
  {
    title: 'Saalisilmoitus',
    description: 'Ilmoita saaliisi nopeasti.',
    href: '/saalis',
    icon: '🦌',
  },
  {
    title: 'Eräkartano',
    description: 'Tee varaus mökkiin.',
    href: '/erakartano',
    icon: '🏕️',
  },
  {
    title: 'Jäsenet',
    description: 'Jäsenrekisteri ja yhteystiedot.',
    href: '/jasenet',
    icon: '👥',
  },
  {
    title: 'Maksut',
    description: 'Jäsenmaksut ja maksutilanne.',
    href: '/maksut',
    icon: '💳',
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Hae profiili
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Hae seurarooli
  const { data: membership } = await supabase
    .from('club_members')
    .select('role, status, clubs(name)')
    .eq('profile_id', user.id)
    .eq('status', 'active')
    .single()

  const displayName = profile?.full_name ?? user.email
  const clubs = membership?.clubs
  const clubName = Array.isArray(clubs) ? (clubs[0]?.name ?? null) : ((clubs as unknown as { name: string } | null)?.name ?? null)
  const role = membership?.role ?? null

  const roleLabel: Record<string, string> = {
    admin: 'Ylläpitäjä',
    board_member: 'Johtokunta',
    member: 'Jäsen',
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-green-400">Tervetuloa</p>
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            {clubName && (
              <p className="mt-1 text-sm text-green-300">{clubName}</p>
            )}
            {role && (
              <span className="mt-2 inline-block rounded-full bg-green-800 px-2.5 py-0.5 text-xs font-medium text-green-200">
                {roleLabel[role] ?? role}
              </span>
            )}
          </div>
          <LogoutButton />
        </div>

        {/* Pika-toiminnot */}
        <div className="mb-6 flex gap-3">
          <Link
            href="/saalis"
            className="flex-1 rounded-xl bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white shadow"
          >
            + Ilmoita saalis
          </Link>
          <Link
            href="/erakartano"
            className="flex-1 rounded-xl bg-stone-700 px-4 py-3 text-center text-sm font-semibold text-white shadow"
          >
            Varaa kartano
          </Link>
        </div>

        {/* Moduulit */}
        <div className="grid grid-cols-2 gap-3">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="rounded-2xl border border-green-800 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <div className="mb-2 text-2xl">{mod.icon}</div>
              <h2 className="font-semibold text-white">{mod.title}</h2>
              <p className="mt-1 text-xs leading-5 text-green-300">
                {mod.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
