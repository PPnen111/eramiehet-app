'use client'

import { BarChart2, Globe, Users, Target, CalendarDays, Tent, CreditCard } from 'lucide-react'

export type DailyActivityRow = {
  date: string
  logins: number
  page_views: number
  unique_users: number
}

export type PageStatRow = {
  page: string
  count: number
  percent: number
}

export type UserActivityRow = {
  profile_id: string
  full_name: string | null
  club_name: string | null
  last_login: string | null
  login_count: number
}

export type AggregateStats = {
  saalis_count: number
  bookings_count: number
  events_count: number
  sent_payments_count: number
}

interface Props {
  dailyActivity: DailyActivityRow[]
  pageStats: PageStatRow[]
  userActivity: UserActivityRow[]
  aggregateStats: AggregateStats
}

function formatFiDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fi-FI', {
    timeZone: 'Europe/Helsinki',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function formatFiDateTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('fi-FI', {
    timeZone: 'Europe/Helsinki',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString('fi-FI', {
    timeZone: 'Europe/Helsinki',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date} klo ${time}`
}

function isToday(iso: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isThisWeek(iso: string | null): boolean {
  if (!iso) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  return new Date(iso) >= cutoff
}

function ActivityBadge({ lastLogin }: { lastLogin: string | null }) {
  if (isToday(lastLogin)) {
    return (
      <span className="inline-flex rounded-full bg-[#1e3d1e] px-2 py-0.5 text-xs font-medium text-[#1a1a1a]">
        Aktiivinen tänään
      </span>
    )
  }
  if (isThisWeek(lastLogin)) {
    return (
      <span className="inline-flex rounded-full bg-blue-800 px-2 py-0.5 text-xs font-medium text-blue-200">
        Aktiivinen
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-[#1e3d1e] px-2 py-0.5 text-xs font-medium text-[#888888]">
      Ei aktiivinen
    </span>
  )
}

export default function UsageTab({ dailyActivity, pageStats, userActivity, aggregateStats }: Props) {
  const maxPageViews = Math.max(...dailyActivity.map((r) => r.page_views), 1)
  const maxPageCount = Math.max(...pageStats.map((r) => r.count), 1)

  return (
    <div className="space-y-8">
      {/* Section 1: Daily activity */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <BarChart2 size={15} className="text-[#2d6a2d]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">
            Päivittäinen aktiivisuus (14 pv)
          </h2>
        </div>
        {dailyActivity.length === 0 ? (
          <p className="text-sm text-[#888888]">Ei dataa vielä.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#e0d8cc]">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-[#e0d8cc] bg-white">
                  {['Päivä', 'Kirjautumiset', 'Sivulataukset', 'Aktiiviset käyttäjät'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4a4a4a]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-green-900">
                {dailyActivity.map((row) => (
                  <tr key={row.date} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                      {formatFiDate(row.date + 'T12:00:00Z')}
                    </td>
                    <td className="px-4 py-2.5 text-[#1e3d1e]">{row.logins}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 max-w-[80px] overflow-hidden rounded-full bg-[#f0ebe3]">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${Math.round((row.page_views / maxPageViews) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[#1e3d1e]">{row.page_views}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[#1e3d1e]">{row.unique_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 2: Popular pages */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Globe size={15} className="text-[#2d6a2d]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">
            Suosituimmat sivut tällä viikolla
          </h2>
        </div>
        {pageStats.length === 0 ? (
          <p className="text-sm text-[#888888]">Ei dataa vielä.</p>
        ) : (
          <div className="space-y-2">
            {pageStats.map((row) => (
              <div
                key={row.page}
                className="flex items-center gap-3 rounded-xl border border-[#e0d8cc] bg-white px-4 py-2.5"
              >
                <span className="w-36 shrink-0 text-sm font-medium text-[#1a1a1a]">{row.page}</span>
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0ebe3]">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${Math.round((row.count / maxPageCount) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-[#1e3d1e]">{row.count}</span>
                  <span className="w-10 text-right text-xs text-[#888888]">{row.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: User logins */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Users size={15} className="text-[#2d6a2d]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">
            Käyttäjien viimeiset kirjautumiset
          </h2>
        </div>
        {userActivity.length === 0 ? (
          <p className="text-sm text-[#888888]">Ei dataa vielä.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#e0d8cc]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[#e0d8cc] bg-white">
                  {['Nimi', 'Seura', 'Viimeksi kirjautunut', 'Kirjautumisia', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4a4a4a]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-green-900">
                {userActivity.map((u) => (
                  <tr key={u.profile_id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                      {u.full_name ?? <span className="text-[#2d6a2d]">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[#1e3d1e]">
                      {u.club_name ?? <span className="text-[#2d6a2d]">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[#1e3d1e]">
                      {u.last_login ? formatFiDateTime(u.last_login) : <span className="text-[#2d6a2d]">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[#1e3d1e]">
                      {u.login_count > 0 ? u.login_count : <span className="text-[#2d6a2d]">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <ActivityBadge lastLogin={u.last_login} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 4: Aggregate stats */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <BarChart2 size={15} className="text-[#2d6a2d]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">
            Toimintojen tilastot
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#e0d8cc] bg-white p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-[#4a4a4a]">
              <Target size={12} />
              Saalisilmoituksia
            </div>
            <p className="text-3xl font-bold text-[#1a1a1a]">{aggregateStats.saalis_count}</p>
          </div>
          <div className="rounded-2xl border border-[#e0d8cc] bg-white p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-[#4a4a4a]">
              <Tent size={12} />
              Varauksia
            </div>
            <p className="text-3xl font-bold text-[#1a1a1a]">{aggregateStats.bookings_count}</p>
          </div>
          <div className="rounded-2xl border border-[#e0d8cc] bg-white p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-[#4a4a4a]">
              <CalendarDays size={12} />
              Tapahtumia luotu
            </div>
            <p className="text-3xl font-bold text-[#1a1a1a]">{aggregateStats.events_count}</p>
          </div>
          <div className="rounded-2xl border border-[#e0d8cc] bg-white p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-[#4a4a4a]">
              <CreditCard size={12} />
              Lähetetyt laskut
            </div>
            <p className="text-3xl font-bold text-[#1a1a1a]">{aggregateStats.sent_payments_count}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
