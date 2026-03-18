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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './logout-button'

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
    description: 'Tee varaus mökkiin.',
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, member_status')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name ?? user.email
  const role = profile?.role ?? null
  const isAdmin = role === 'admin' || role === 'board_member'
  const RoleIcon = role ? (roleIcon[role] ?? User) : null

  const modules = isAdmin
    ? [...COMMON_MODULES, ...ADMIN_MODULES]
    : COMMON_MODULES

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-green-400">Tervetuloa</p>
            <h1 className="bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-2xl font-bold text-transparent">
              {displayName}
            </h1>
            {role && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-800/60 px-2.5 py-0.5 text-xs font-medium text-green-200">
                {RoleIcon && <RoleIcon size={11} />}
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
        {role === 'superadmin' && (
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
