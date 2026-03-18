'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House,
  CalendarDays,
  Target,
  Tent,
  CreditCard,
  Settings2,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const MEMBER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Koti', icon: House },
  { href: '/tapahtumat', label: 'Tapahtumat', icon: CalendarDays },
  { href: '/saalis', label: 'Saalis', icon: Target },
  { href: '/erakartano', label: 'Kartano', icon: Tent },
  { href: '/maksut', label: 'Maksut', icon: CreditCard },
]

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Koti', icon: House },
  { href: '/tapahtumat', label: 'Tapahtumat', icon: CalendarDays },
  { href: '/saalis', label: 'Saalis', icon: Target },
  { href: '/erakartano', label: 'Kartano', icon: Tent },
  { href: '/hallinto', label: 'Hallinto', icon: Settings2 },
]

const HIDDEN_PATHS = ['/login', '/rekisteroidy']

export default function BottomNavClient({ role }: { role: string | null }) {
  const pathname = usePathname()

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  const items =
    role === 'admin' || role === 'board_member' ? ADMIN_NAV : MEMBER_NAV

  return (
    <>
      <div className="h-20 md:hidden" />
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="border-t border-green-900 bg-green-950/90 backdrop-blur-md">
          <div className="flex items-stretch">
            {items.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-1 flex-col items-center gap-0.5 px-1 py-3 text-[10px] font-medium transition-colors ${
                    active ? 'text-green-300' : 'text-green-600 hover:text-green-400'
                  }`}
                >
                  {active && (
                    <span className="absolute top-0 h-0.5 w-8 rounded-full bg-green-400" />
                  )}
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
