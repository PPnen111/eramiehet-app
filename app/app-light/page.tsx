import Link from 'next/link'
import {
  Home,
  Users,
  MessageSquare,
  Calendar,
  Euro,
  House,
  FileText,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; active?: boolean }

const NAV: NavItem[] = [
  { href: '#', label: 'Yleiskatsaus', icon: Home, active: true },
  { href: '#', label: 'Jäsenet', icon: Users },
  { href: '#', label: 'Viestintä', icon: MessageSquare },
  { href: '#', label: 'Tapahtumat', icon: Calendar },
  { href: '#', label: 'Maksut', icon: Euro },
  { href: '#', label: 'Varaukset', icon: House },
  { href: '#', label: 'Dokumentit', icon: FileText },
  { href: '#', label: 'Asetukset', icon: Settings },
]

const KPIS = [
  { title: 'Jäsenet', value: '128', delta: '+5 tässä kuussa', tone: 'success' as const },
  { title: 'Tapahtumat', value: '6', delta: 'Seuraavat 30 päivää', tone: 'neutral' as const },
  { title: 'Maksut', value: '12 450 €', delta: 'Avoimia 1 250 €', tone: 'warning' as const },
  { title: 'Varaukset', value: '8', delta: 'Tulevat varaukset', tone: 'neutral' as const },
]

const RECENT_EVENTS = [
  { title: 'Hirvenmetsästyksen aloitus', date: 'La 27.9.', meta: '23 ilmoittautunutta' },
  { title: 'Vuosikokous', date: 'Ke 15.10.', meta: 'Seuratalo, klo 18:00' },
  { title: 'Ampumaharjoitus', date: 'Su 19.10.', meta: 'Rata 1, klo 10:00' },
  { title: 'Talkoot — kämppä', date: 'La 25.10.', meta: 'Ilmoittauduttu: 12' },
]

const RECENT_MESSAGES = [
  { from: 'Pekka Saarinen', subject: 'Hirvenmetsästyksen ohjeet', time: '2 t' },
  { from: 'Hallitus', subject: 'Pöytäkirja 9/2025', time: '5 t' },
  { from: 'Anna Mäkelä', subject: 'Vierasluvan kysely', time: 'eilen' },
  { from: 'Jari Korhonen', subject: 'Kämpän avain', time: '2 pv' },
]

const POPULAR_BOOKINGS = [
  { name: 'Päämaja', count: 24 },
  { name: 'Pohjoiskämppä', count: 18 },
  { name: 'Sauna', count: 12 },
  { name: 'Ampumarata', count: 9 },
]

function PaymentDonut() {
  // values: paid 78, pending 17, overdue 5 (% of total)
  const segments = [
    { value: 78, color: '#2d6a2d', label: 'Maksettu' },
    { value: 17, color: '#b45309', label: 'Avoimet' },
    { value: 5, color: '#dc2626', label: 'Erääntyneet' },
  ]
  const radius = 60
  const stroke = 18
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1ece3" strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const length = (seg.value / 100) * circumference
          const dasharray = `${length} ${circumference - length}`
          const dashoffset = -offset
          offset += length
          return (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform="rotate(-90 80 80)"
              strokeLinecap="butt"
            />
          )
        })}
        <text
          x="80"
          y="76"
          textAnchor="middle"
          className="fill-[var(--foreground)]"
          style={{ fontSize: 22, fontWeight: 700 }}
        >
          78%
        </text>
        <text
          x="80"
          y="96"
          textAnchor="middle"
          className="fill-[var(--foreground-muted)]"
          style={{ fontSize: 11 }}
        >
          maksettu
        </text>
      </svg>

      <ul className="space-y-2 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-[var(--foreground-secondary)]">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: seg.color }}
              aria-hidden
            />
            <span className="font-medium text-[var(--foreground)]">{seg.label}</span>
            <span className="text-[var(--foreground-muted)]">{seg.value} %</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function KpiCard({ title, value, delta, tone }: (typeof KPIS)[number]) {
  const toneColor =
    tone === 'success'
      ? 'var(--success)'
      : tone === 'warning'
        ? 'var(--warning)'
        : 'var(--foreground-muted)'

  const Icon = tone === 'success' ? TrendingUp : tone === 'warning' ? AlertCircle : Clock

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--foreground-secondary)]">{title}</p>
        <Icon size={18} style={{ color: toneColor }} />
      </div>
      <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-xs" style={{ color: toneColor }}>
        {delta}
      </p>
    </div>
  )
}

export default function AppLightPage() {
  return (
    <div
      className="light-theme min-h-screen"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* Theme banner */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3 text-sm"
        style={{
          background: '#fff7e6',
          borderColor: '#f1d399',
          color: '#5b3d00',
        }}
      >
        <span>🎨 Tämä on vaalea teema -esikatselu.</span>
        <Link
          href="/dashboard"
          className="rounded-md px-3 py-1.5 font-medium transition-colors"
          style={{ background: '#1e3d1e', color: '#fff' }}
        >
          ← Takaisin tummaan teemaan
        </Link>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className="hidden w-64 shrink-0 flex-col justify-between p-5 lg:flex"
          style={{
            minHeight: 'calc(100vh - 49px)',
            background: 'var(--sidebar-bg)',
            color: 'var(--sidebar-text)',
          }}
        >
          <div>
            <div className="mb-8 flex items-center gap-2 px-2">
              <div
                className="grid h-9 w-9 place-items-center rounded-lg font-bold"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                JP
              </div>
              <div>
                <p className="text-base font-bold">JahtiPro</p>
                <p className="text-xs opacity-70">Erämiehet ry</p>
              </div>
            </div>

            <nav className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    style={{
                      background: item.active ? 'var(--sidebar-active)' : 'transparent',
                      color: item.active ? '#fff' : 'rgba(255,255,255,0.85)',
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </nav>
          </div>

          <div
            className="flex items-center gap-3 rounded-lg p-3"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="grid h-10 w-10 place-items-center rounded-full font-bold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              MM
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Mikko Metsästäjä</p>
              <p className="truncate text-xs opacity-70">Puheenjohtaja</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-10">
          <header className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Yleiskatsaus</h1>
              <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                Seuran tilanne lyhyesti — tervetuloa, Mikko.
              </p>
            </div>
            <p className="hidden text-sm text-[var(--foreground-muted)] md:block">
              Päivitetty juuri nyt
            </p>
          </header>

          {/* KPIs */}
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {KPIS.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} />
            ))}
          </section>

          {/* Two columns: events + messages */}
          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-xl border p-5"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
                Viimeisimmät tapahtumat
              </h2>
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {RECENT_EVENTS.map((e) => (
                  <li key={e.title} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {e.title}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">{e.meta}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-md px-2 py-1 text-xs font-medium"
                      style={{ background: '#eaf2ea', color: 'var(--primary)' }}
                    >
                      {e.date}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-xl border p-5"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
                Uusimmat viestit
              </h2>
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {RECENT_MESSAGES.map((m) => (
                  <li key={m.subject} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {m.subject}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">{m.from}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--foreground-muted)]">
                      {m.time}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Two columns: payments donut + popular bookings */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-xl border p-5"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
                Maksutilanne
              </h2>
              <PaymentDonut />
            </div>

            <div
              className="rounded-xl border p-5"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
                Suosituimmat varaukset
              </h2>
              <ul className="space-y-3">
                {POPULAR_BOOKINGS.map((b) => {
                  const max = Math.max(...POPULAR_BOOKINGS.map((x) => x.count))
                  const pct = Math.round((b.count / max) * 100)
                  return (
                    <li key={b.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--foreground)]">{b.name}</span>
                        <span className="text-[var(--foreground-muted)]">{b.count} kpl</span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full"
                        style={{ background: '#f1ece3' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: 'var(--primary)' }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                <span>Tilastot päivittyvät reaaliaikaisesti</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
