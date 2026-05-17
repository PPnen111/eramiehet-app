import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays,
  BookOpen,
  Target,
  Tent,
  Ticket,
  Users,
  CreditCard,
  Map as MapIcon,
  Settings,
  Settings2,
  Building2,
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
    title: 'Riistanhallinta',
    description: 'Erämiesten oma saalistilasto',
    href: '/saalis',
    icon: Target,
  },
  {
    title: 'Paikkavaraukset',
    description: 'Tee varaus eräkartanoon.',
    href: '/erakartano',
    icon: Tent,
  },
  {
    title: 'Vierasluvat',
    description: 'Myönnetyt vierasluvat ja laskutus.',
    href: '/vierasluvat',
    icon: Ticket,
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
    icon: MapIcon,
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

  // Check onboarding (skip for superadmin)
  if (profileRole !== 'superadmin' && activeClubId) {
    const { data: obRaw } = await supabase
      .from('onboarding')
      .select('completed_at')
      .eq('club_id', activeClubId)
      .maybeSingle()
    const ob = obRaw as { completed_at: string | null } | null
    if (ob && !ob.completed_at) {
      redirect('/onboarding')
    }
  }

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

  // Active guest permits for this club (status='active' AND valid_until >= today)
  type GuestPermitDash = {
    id: string
    guest_name: string
    area: string | null
    host_profile_id: string | null
    host_registry_id: string | null
    payment_id: string | null
  }
  let guestPermitCount = 0
  let guestPermitPreview: { id: string; guest_name: string; host_name: string | null; area: string | null; payment_status: 'paid' | 'pending' | 'none' }[] = []
  if (activeClubId) {
    try {
      const admin = createAdminClient()
      const today = new Date().toISOString().slice(0, 10)
      const { data: permitsRaw } = await admin
        .from('guest_permits')
        .select('id, guest_name, area, host_profile_id, host_registry_id, payment_id, valid_until')
        .eq('club_id', activeClubId)
        .eq('status', 'active')
        .or(`valid_until.gte.${today},valid_until.is.null`)
        .order('created_at', { ascending: false })
      const permits = (permitsRaw ?? []) as (GuestPermitDash & { valid_until: string | null })[]
      guestPermitCount = permits.length

      const slice = permits.slice(0, 3)
      const hostProfileIds = [...new Set(slice.map((p) => p.host_profile_id).filter((x): x is string => !!x))]
      const hostRegistryIds = [...new Set(slice.map((p) => p.host_registry_id).filter((x): x is string => !!x))]
      const paymentIds = [...new Set(slice.map((p) => p.payment_id).filter((x): x is string => !!x))]

      const [{ data: pfData }, { data: rgData }, { data: payData }] = await Promise.all([
        hostProfileIds.length > 0
          ? admin.from('profiles').select('id, full_name').in('id', hostProfileIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
        hostRegistryIds.length > 0
          ? admin.from('member_registry').select('id, full_name').in('id', hostRegistryIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
        paymentIds.length > 0
          ? admin.from('payments').select('id, status').in('id', paymentIds)
          : Promise.resolve({ data: [] as { id: string; status: string }[] }),
      ])
      const pfMap = new Map(((pfData ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name]))
      const rgMap = new Map(((rgData ?? []) as { id: string; full_name: string | null }[]).map((r) => [r.id, r.full_name]))
      const payMap = new Map(((payData ?? []) as { id: string; status: string }[]).map((p) => [p.id, p.status]))

      guestPermitPreview = slice.map((p) => {
        const host_name = p.host_profile_id
          ? (pfMap.get(p.host_profile_id) ?? null)
          : p.host_registry_id
          ? (rgMap.get(p.host_registry_id) ?? null)
          : null
        const ps = p.payment_id ? (payMap.get(p.payment_id) === 'paid' ? 'paid' : 'pending') : 'none'
        return { id: p.id, guest_name: p.guest_name, host_name, area: p.area, payment_status: ps as 'paid' | 'pending' | 'none' }
      })
    } catch {
      // silent fail — card falls back to 0
    }
  }

  // Role comes from profiles directly; superadmin lives on profiles.role
  const role = profileRole === 'superadmin' ? 'superadmin' : profileRole

  const RoleIcon = role ? (roleIcon[role] ?? User) : null

  const modules = isBoardOrAbove(role)
    ? [...COMMON_MODULES, ...ADMIN_MODULES]
    : COMMON_MODULES

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-8">
      <LoginTracker />
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#888888]">Tervetuloa</p>
            <Link
              href="/profiili"
              className="group inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
                {displayName}
              </h1>
              <Pencil size={13} className="text-[#2d6a2d] group-hover:text-[#1e3d1e] transition-colors" />
            </Link>
            {clubName && (
              <p className="mt-0.5 text-sm text-[#4a4a4a]">{clubName}</p>
            )}
            {role && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#eaf3de] px-2 py-0.5 text-[10px] font-medium text-[#3b6d11]">
                {RoleIcon && <RoleIcon size={11} />}
                {roleLabel[role] ?? role}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeClubId && (
              <Link
                href="/vaihda-seura"
                className="flex items-center gap-1.5 rounded-lg border border-[#e0d8cc] bg-white px-3 py-1.5 text-xs font-medium text-[#1e3d1e] hover:bg-[#f0ebe3] transition-colors"
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
          <div className="mb-6 rounded-2xl border border-[#fcd34d] bg-[#fef3c7] px-4 py-4">
            <p className="text-sm font-semibold text-[#92400e]">Tervetuloa JahtiProhon! 🎉</p>
            <p className="mt-1 text-sm text-[#92400e]">
              Tilisi odottaa seuran johtokunnan hyväksyntää. Sinut hyväksytään pian — ei tarvitse tehdä muuta kuin odottaa.
            </p>
            <p className="mt-1 text-xs text-[#b45309]">
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
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1e3d1e] px-4 py-3 text-sm font-semibold text-white shadow hover:bg-[#162d16] transition-colors"
          >
            <PlusCircle size={16} />
            Ilmoita saalis
          </Link>
          <Link
            href="/erakartano"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e0d8cc] bg-white px-4 py-3 text-sm font-semibold text-[#1a1a1a] shadow-sm hover:bg-[#f0ebe3] transition-colors"
          >
            <CalendarPlus size={16} />
            Varaa kartano
          </Link>
        </div>

        {/* Superadmin-linkit */}
        {isSuperAdmin(profileRole) && (
          <div className="mb-4 space-y-2">
            <Link
              href="/operaattori"
              className="card-shadow-hover flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#1e3d1e] hover:bg-[#f0ebe3]"
            >
              <Building2 size={16} />
              <div className="flex-1">
                <span>Operaattori</span>
                <p className="text-xs font-normal text-[#888888]">Seurat, myyntiputki, KPI</p>
              </div>
              <span className="text-xs text-[#2d6a2d]">Avaa →</span>
            </Link>
            <Link
              href="/superadmin"
              className="flex items-center gap-3 rounded-xl border border-[#fcd34d] bg-[#fef3c7] px-4 py-3 text-sm font-semibold text-[#92400e] hover:bg-[#fde9a8] transition-colors"
            >
              <Settings size={16} />
              <span>Superadmin-paneeli</span>
            </Link>
            <Link
              href="/profiili/mfa"
              className="card-shadow-hover flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f0ebe3]"
            >
              <Shield size={16} />
              <span>Kaksivaiheinen tunnistautuminen (2FA)</span>
            </Link>
          </div>
        )}

        {/* Kehityssuunnitelma */}
        {(profileRole === 'superadmin' || devAccess) && (
          <div className="mb-4">
            <Link
              href="/kehitys"
              className="card-shadow-hover flex items-center gap-3 rounded-xl bg-white px-4 py-3 hover:bg-[#f0ebe3]"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1a1a1a]">🗺️ Kehityssuunnitelma</p>
                <p className="text-xs text-[#888888]">Yhteinen kehitystyötila</p>
              </div>
              <span className="text-xs text-[#2d6a2d]">Avaa →</span>
            </Link>
          </div>
        )}

        {/* Onboarding card for new clubs */}
        {role === 'admin' && isNewClub && (
          <div className="mb-4">
            <Link
              href="/onboarding"
              className="flex items-center justify-between rounded-xl border border-[#2d6a2d] bg-[#eaf3de] px-4 py-3 hover:bg-[#dceccb] transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-[#1e3d1e]">Viimeistele käyttöönotto</p>
                <p className="text-xs text-[#3b6d11]">Kutsu jäseniä, lisää tapahtumia ja dokumentteja →</p>
              </div>
              <ArrowLeftRight size={16} className="shrink-0 text-[#2d6a2d] rotate-90" />
            </Link>
          </div>
        )}

        {/* Omat ryhmät */}
        {myGroups.length > 0 && (
          <div className="mb-4 space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#4a4a4a]">
              Omat ryhmät
            </h2>
            {myGroups.map((g) => (
              <div
                key={g.id}
                className="card-shadow rounded-xl bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1a1a1a]">{g.name}</p>
                    {g.description && (
                      <p className="mt-0.5 text-xs text-[#888888]">{g.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[#4a4a4a]">
                      <span>{g.memberCount} jäsentä</span>
                      {g.leaderName && <span>Johtaja: {g.leaderName}</span>}
                    </div>
                  </div>
                  {g.myRole === 'leader' && (
                    <span className="shrink-0 rounded-full bg-[#1e3d1e] px-2 py-0.5 text-[10px] font-bold text-white">
                      Ryhmänjohtaja
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vierasluvat */}
        <div className="card-shadow mb-4 rounded-2xl bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Ticket size={18} className="text-[#2d6a2d]" />
            <h2 className="font-bold tracking-tight text-[#1a1a1a]">Vierasluvat</h2>
            <span className="rounded-full bg-[#eaf3de] px-2 py-0.5 text-[10px] font-medium text-[#3b6d11]">
              {guestPermitCount}
            </span>
          </div>
          {guestPermitCount === 0 ? (
            <p className="text-sm text-[#888888]">Ei aktiivisia vieraslupia</p>
          ) : (
            <ul className="space-y-1.5">
              {guestPermitPreview.map((p) => {
                const statusLabel =
                  p.payment_status === 'paid'
                    ? '✅ Maksettu'
                    : p.payment_status === 'pending'
                    ? '⏳ Odottaa'
                    : 'Ei laskutettu'
                const parts = [p.guest_name, p.host_name ?? '—', p.area ?? '—', statusLabel]
                return (
                  <li key={p.id} className="truncate text-xs text-[#4a4a4a]">
                    {parts.join(' | ')}
                  </li>
                )
              })}
              {guestPermitCount > guestPermitPreview.length && (
                <li className="text-xs text-[#888888]">
                  + {guestPermitCount - guestPermitPreview.length} muuta
                </li>
              )}
            </ul>
          )}
          <div className="mt-4 flex gap-2">
            {isBoardOrAbove(role) && (
              <Link
                href="/vierasluvat"
                className="flex-1 rounded-lg bg-[#1e3d1e] px-3 py-2 text-center text-xs font-semibold text-white hover:bg-[#162d16] transition-colors"
              >
                Myönnä uusi lupa
              </Link>
            )}
            <Link
              href="/vierasluvat"
              className="flex-1 rounded-lg border border-[#e0d8cc] px-3 py-2 text-center text-xs font-semibold text-[#1a1a1a] hover:bg-[#f0ebe3] transition-colors"
            >
              Näytä kaikki
            </Link>
          </div>
        </div>

        {/* Moduulit */}
        <div className="grid grid-cols-2 gap-3">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="card-shadow-hover group rounded-2xl bg-white p-4 hover:bg-[#f0ebe3]"
              >
                <div className="mb-2 text-[#2d6a2d] transition-colors group-hover:text-[#1e3d1e]">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <h2 className="font-semibold text-[#1a1a1a]">{mod.title}</h2>
                <p className="mt-1 text-xs leading-5 text-[#4a4a4a]">
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
