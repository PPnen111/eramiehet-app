import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays,
  BookOpen,
  Target,
  Tent,
  Users,
  CreditCard,
  Map,
  Settings,
  Settings2,
  PlusCircle,
  CalendarPlus,
  Shield,
  User,
  Star,
  ArrowLeftRight,
  Pencil,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBoardOrAbove, isSuperAdmin } from '@/lib/auth'
import LogoutButton from './logout-button'
import LoginTracker from '@/app/components/login-tracker'
import WelcomeCard from './welcome-card'

type ModuleItem = {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}

const COMMON_MODULES: ModuleItem[] = [
  {
    title: 'Tapahtumat',
    description: 'Talkoot, kokoukset, jahdit ja harjoitukset.',
    href: '/tapahtumat',
    icon: CalendarDays,
  },
  {
    title: 'Metsästäjille',
    description: 'Säännöt, pöytäkirjat ja ohjeet.',
    href: '/dokumentit',
    icon: BookOpen,
  },
  {
    title: 'Saalisilmoitus',
    description: 'Ilmoita saaliisi nopeasti.',
    href: '/saalis',
    icon: Target,
  },
  {
    title: 'Eräkartano',
    description: 'Tee varaus eräkartanoon.',
    href: '/erakartano',
    icon: Tent,
  },
  {
    title: 'Maksut',
    description: 'Jäsenmaksut ja maksutilanne.',
    href: '/maksut',
    icon: CreditCard,
  },
  {
    title: 'Karttatunnukset',
    description: 'Karttapalvelujen tunnukset.',
    href: '/karttatunnukset',
    icon: Map,
  },
]

const ADMIN_MODULES: ModuleItem[] = [
  {
    title: 'Jäsenet',
    description: 'Jäsenrekisteri ja yhteystiedot.',
    href: '/jasenet',
    icon: Users,
  },
  {
    title: 'Hallinto',
    description: 'Jäsenet, maksut ja dokumentit.',
    href: '/hallinto',
    icon: Settings2,
  },
]

const roleLabel: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
  superadmin: 'Superadmin',
}

const roleIcon: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  admin: Shield,
  board_member: Star,
  member: User,
  superadmin: Settings,
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile for display name, active_club_id, and superadmin check
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, role, active_club_id, dev_access, member_status')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    full_name: string | null
    role: string | null
    active_club_id: string | null
    dev_access: boolean | null
    member_status: string | null
  } | null

  const displayName = profile?.full_name ?? user.email
  const profileRole = profile?.role ?? null
  const devAccess = profile?.dev_access ?? false
  const activeClubId = profile?.active_club_id ?? null
  const memberStatus = profile?.member_status ?? null

  // Fetch club name and created_at for the active club
  let clubName: string | null = null
  let clubCreatedAt: string | null = null
  if (activeClubId) {
    const { data: clubData } = await supabase
      .from('clubs')
      .select('name, created_at')
      .eq('id', activeClubId)
      .single()
    const club = clubData as { name: string; created_at: string } | null
    clubName = club?.name ?? null
    clubCreatedAt = club?.created_at ?? null
  }

  const isNewClub =
    clubCreatedAt !== null &&
    new Date(clubCreatedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Fetch user's groups
  type MyGroupMembership = {
    group_id: string
    role: string
    club_groups: { id: string; name: string; description: string | null } | null
  }
  type GroupMemberForCount = {
    group_id: string
    role: string
    profiles: { full_name: string | null } | null
  }

  let myGroups: { id: string; name: string; description: string | null; memberCount: number; leaderName: string | null; myRole: string }[] = []

  try {
    const admin = createAdminClient()
    const { data: membershipsRaw } = await admin
      .from('club_group_members')
      .select('group_id, role, club_groups(id, name, description)')
      .eq('profile_id', user.id)

    const memberships = (membershipsRaw ?? []) as unknown as MyGroupMembership[]
    const groupIds = memberships.map((m) => m.group_id)

    if (groupIds.length > 0) {
      const { data: allMembersRaw } = await admin
        .from('club_group_members')
        .select('group_id, role, profiles(full_name)')
        .in('group_id', groupIds)

      const allMembers = (allMembersRaw ?? []) as unknown as GroupMemberForCount[]

      myGroups = memberships
        .filter((m) => m.club_groups)
        .map((m) => {
          const g = m.club_groups as unknown as { id: string; name: string; description: string | null }
          const groupMembers = allMembers.filter((gm) => gm.group_id === m.group_id)
          const leader = groupMembers.find((gm) => gm.role === 'leader')
          const leaderName = (leader?.profiles as unknown as { full_name: string | null } | null)?.full_name ?? null
          return {
            id: g.id,
            name: g.name,
            description: g.description,
            memberCount: groupMembers.length,
            leaderName,
            myRole: m.role,
          }
        })
    }
  } catch {
    // admin client may not be available locally
  }

  // Role comes from profiles directly; superadmin lives on profiles.role
  const role = profileRole === 'superadmin' ? 'superadmin' : profileRole

  const RoleIcon = role ? (roleIcon[role] ?? User) : null

  const modules = isBoardOrAbove(role)
    ? [...COMMON_MODULES, ...ADMIN_MODULES]
    : COMMON_MODULES

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <LoginTracker />
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-green-400">Tervetuloa</p>
            <Link
              href="/profiili"
              className="group inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <h1 className="bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-2xl font-bold text-transparent">
                {displayName}
              </h1>
              <Pencil size={13} className="text-green-500 group-hover:text-green-300 transition-colors" />
            </Link>
            {clubName && (
              <p className="mt-0.5 text-sm text-green-500">{clubName}</p>
            )}
            {role && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-800/60 px-2.5 py-0.5 text-xs font-medium text-green-200">
                {RoleIcon && <RoleIcon size={11} />}
                {roleLabel[role] ?? role}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeClubId && (
              <Link
                href="/vaihda-seura"
                className="flex items-center gap-1.5 rounded-lg border border-green-700 bg-green-900/40 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-900/70 transition-colors"
              >
                <ArrowLeftRight size={13} />
                Vaihda seuraa
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        {/* Pending banner */}
        {memberStatus === 'pending' && (
          <div className="mb-6 rounded-2xl border border-yellow-700 bg-yellow-900/20 px-4 py-4">
            <p className="text-sm font-semibold text-yellow-200">Tervetuloa JahtiProhon! 🎉</p>
            <p className="mt-1 text-sm text-yellow-300">
              Tilisi odottaa seuran johtokunnan hyväksyntää. Sinut hyväksytään pian — ei tarvitse tehdä muuta kuin odottaa.
            </p>
            <p className="mt-1 text-xs text-yellow-500">
              Jos sinulla on kiire, ota yhteyttä seuran johtokuntaan.
            </p>
          </div>
        )}

        {/* First-login welcome card (active non-admin members) */}
        {memberStatus === 'active' && role !== 'admin' && role !== 'board_member' && (
          <WelcomeCard name={profile?.full_name ?? null} />
        )}

        {/* Pika-toiminnot */}
        <div className="mb-6 flex gap-3">
          <Link
            href="/saalis"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-green-600 transition-colors"
          >
            <PlusCircle size={16} />
            Ilmoita saalis
          </Link>
          <Link
            href="/erakartano"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-700 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-stone-600 transition-colors"
          >
            <CalendarPlus size={16} />
            Varaa kartano
          </Link>
        </div>

        {/* Superadmin-linkki */}
        {isSuperAdmin(profileRole) && (
          <div className="mb-4">
            <Link
              href="/superadmin"
              className="flex items-center gap-3 rounded-xl border border-yellow-700 bg-yellow-900/20 px-4 py-3 text-sm font-semibold text-yellow-300 hover:bg-yellow-900/40 transition-colors"
            >
              <Settings size={16} />
              <span>Superadmin-paneeli</span>
            </Link>
          </div>
        )}

        {/* Kehityssuunnitelma */}
        {(profileRole === 'superadmin' || devAccess) && (
          <div className="mb-4">
            <Link
              href="/kehitys"
              className="flex items-center gap-3 rounded-xl border border-green-700 bg-green-900/20 px-4 py-3 hover:bg-green-900/40 transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-200">🗺️ Kehityssuunnitelma</p>
                <p className="text-xs text-green-500">Yhteinen kehitystyötila</p>
              </div>
              <span className="text-xs text-green-400">Avaa →</span>
            </Link>
          </div>
        )}

        {/* Onboarding card for new clubs */}
        {role === 'admin' && isNewClub && (
          <div className="mb-4">
            <Link
              href="/onboarding"
              className="flex items-center justify-between rounded-xl border border-green-600 bg-green-900/30 px-4 py-3 hover:bg-green-900/50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-green-200">Viimeistele käyttöönotto</p>
                <p className="text-xs text-green-400">Kutsu jäseniä, lisää tapahtumia ja dokumentteja →</p>
              </div>
              <ArrowLeftRight size={16} className="shrink-0 text-green-400 rotate-90" />
            </Link>
          </div>
        )}

        {/* Omat ryhmät */}
        {myGroups.length > 0 && (
          <div className="mb-4 space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
              Omat ryhmät
            </h2>
            {myGroups.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-green-800 bg-white/5 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{g.name}</p>
                    {g.description && (
                      <p className="mt-0.5 text-xs text-green-500">{g.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-green-600">
                      <span>{g.memberCount} jäsentä</span>
                      {g.leaderName && <span>Johtaja: {g.leaderName}</span>}
                    </div>
                  </div>
                  {g.myRole === 'leader' && (
                    <span className="shrink-0 rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-bold text-green-100">
                      Ryhmänjohtaja
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Moduulit */}
        <div className="grid grid-cols-2 gap-3">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group rounded-2xl border border-green-800 bg-white/5 p-4 backdrop-blur-sm transition-all duration-150 hover:bg-white/10 hover:-translate-y-0.5 hover:border-green-700 hover:shadow-lg hover:shadow-green-950/50"
              >
                <div className="mb-2 text-green-400 transition-colors group-hover:text-green-300">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <h2 className="font-semibold text-white">{mod.title}</h2>
                <p className="mt-1 text-xs leading-5 text-green-400">
                  {mod.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
