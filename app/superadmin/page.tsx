import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import SuperadminTabs from './superadmin-tabs'
import type { EnhancedClub, UserRow } from './analytics-tab'
import type { FeedbackRow } from './feedback-tab'
import type { SubscriptionRow } from './subscriptions-tab'
import type { DailyActivityRow, PageStatRow, UserActivityRow, AggregateStats } from './usage-tab'

type ProfileData = {
  id: string
  club_id: string | null
  full_name: string | null
  role: string | null
}

type ClubData = {
  id: string
  name: string | null
  created_at: string
}

type ActivityLogRow = {
  event_type: string
  profile_id: string | null
  created_at: string
}

type PageViewRow = {
  page: string | null
}

type LoginRow = {
  profile_id: string | null
  created_at: string
}

type SubscriptionRaw = {
  id: string
  club_id: string
  status: string
  trial_starts_at: string | null
  trial_ends_at: string | null
  activated_at: string | null
  created_at: string
  clubs: { name: string | null } | null
}

type FeedbackRaw = {
  id: string
  profile_id: string | null
  club_id: string | null
  page: string | null
  rating: number | null
  message: string | null
  category: string | null
  status: string
  created_at: string
  profiles: { full_name: string | null } | null
  clubs: { name: string | null } | null
}

function isWithinDays(iso: string | null, days: number): boolean {
  if (!iso) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return new Date(iso) >= cutoff
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

  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: authData },
    { data: profilesRaw },
    { data: clubsRaw },
    { data: feedbackRaw },
    { data: subscriptionsRaw },
    { data: activityRaw },
    { data: pageViewRaw },
    { data: loginRaw },
    { count: saalisCount },
    { count: bookingsCount },
    { count: eventsCount },
    { count: sentPaymentsCount },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('profiles').select('id, club_id, full_name, role'),
    admin.from('clubs').select('id, name, created_at').order('created_at', { ascending: false }),
    admin
      .from('feedback')
      .select('*, profiles(full_name), clubs(name)')
      .order('created_at', { ascending: false }),
    admin
      .from('subscriptions')
      .select('*, clubs(name)')
      .order('created_at', { ascending: false }),
    admin
      .from('activity_log')
      .select('event_type, profile_id, created_at')
      .gte('created_at', fourteenDaysAgo)
      .order('created_at', { ascending: false }),
    admin
      .from('activity_log')
      .select('page')
      .eq('event_type', 'page_view')
      .gte('created_at', sevenDaysAgo),
    admin
      .from('activity_log')
      .select('profile_id, created_at')
      .eq('event_type', 'login')
      .order('created_at', { ascending: false }),
    admin.from('saalis').select('id', { count: 'exact', head: true }),
    admin.from('bookings').select('id', { count: 'exact', head: true }),
    admin.from('events').select('id', { count: 'exact', head: true }),
    admin.from('payments').select('id', { count: 'exact', head: true }).not('sent_at', 'is', null),
  ])

  const authUsers = authData?.users ?? []
  const profiles = (profilesRaw ?? []) as unknown as ProfileData[]
  const clubs = (clubsRaw ?? []) as unknown as ClubData[]

  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const clubById = new Map(clubs.map((c) => [c.id, c]))

  const userRows: UserRow[] = authUsers.map((u) => {
    const profile = profileById.get(u.id)
    const club = profile?.club_id ? clubById.get(profile.club_id) : undefined
    return {
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      full_name: profile?.full_name ?? null,
      role: profile?.role ?? null,
      club_name: club?.name ?? null,
    }
  })

  const totalClubs = clubs.length
  const totalUsers = authUsers.length
  const newThisWeek = authUsers.filter((u) => isWithinDays(u.created_at, 7)).length
  const activeToday = authUsers.filter((u) => isToday(u.last_sign_in_at ?? null)).length

  const enhancedClubs: EnhancedClub[] = clubs.map((club) => {
    const clubProfiles = profiles.filter((p) => p.club_id === club.id)
    const memberCount = clubProfiles.length

    const adminProfile = clubProfiles.find((p) => p.role === 'admin')
    const adminAuthUser = adminProfile
      ? authUsers.find((u) => u.id === adminProfile.id)
      : undefined

    const clubAuthUsers = authUsers.filter((u) => {
      const p = profileById.get(u.id)
      return p?.club_id === club.id
    })
    const latestActivity = clubAuthUsers.reduce<string | null>((latest, u) => {
      if (!u.last_sign_in_at) return latest
      if (!latest) return u.last_sign_in_at
      return u.last_sign_in_at > latest ? u.last_sign_in_at : latest
    }, null)

    return {
      id: club.id,
      name: club.name,
      created_at: club.created_at,
      memberCount,
      adminName: adminProfile?.full_name ?? null,
      adminEmail: adminAuthUser?.email ?? null,
      latestActivity,
    }
  })

  const feedbackRows: FeedbackRow[] = ((feedbackRaw ?? []) as unknown as FeedbackRaw[]).map(
    (r) => ({
      id: r.id,
      profile_id: r.profile_id,
      club_id: r.club_id,
      page: r.page,
      rating: r.rating,
      message: r.message,
      category: r.category,
      status: r.status,
      created_at: r.created_at,
      full_name: r.profiles?.full_name ?? null,
      club_name: r.clubs?.name ?? null,
    })
  )

  const unreadFeedbackCount = feedbackRows.filter((r) => r.status === 'uusi').length

  // ── Usage analytics ──────────────────────────────────────────────────────────

  // Daily activity — group raw rows by date (UTC date string)
  const activityRows = (activityRaw ?? []) as unknown as ActivityLogRow[]
  const dailyMap = new Map<string, { logins: Set<string>; page_views: number; unique_users: Set<string> }>()
  for (const row of activityRows) {
    const date = row.created_at.slice(0, 10)
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { logins: new Set(), page_views: 0, unique_users: new Set() })
    }
    const day = dailyMap.get(date)!
    if (row.event_type === 'login' && row.profile_id) day.logins.add(row.profile_id)
    if (row.event_type === 'page_view') day.page_views++
    if (row.profile_id) day.unique_users.add(row.profile_id)
  }
  const dailyActivity: DailyActivityRow[] = Array.from(dailyMap.entries())
    .map(([date, d]) => ({
      date,
      logins: d.logins.size,
      page_views: d.page_views,
      unique_users: d.unique_users.size,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))

  // Page stats — this week
  const pageViewRows = (pageViewRaw ?? []) as unknown as PageViewRow[]
  const pageCountMap = new Map<string, number>()
  for (const row of pageViewRows) {
    if (!row.page) continue
    pageCountMap.set(row.page, (pageCountMap.get(row.page) ?? 0) + 1)
  }
  const totalPageViews = Array.from(pageCountMap.values()).reduce((sum, n) => sum + n, 0)
  const pageStats: PageStatRow[] = Array.from(pageCountMap.entries())
    .map(([page, count]) => ({
      page,
      count,
      percent: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // User login stats — last login + count per user
  const loginRows = (loginRaw ?? []) as unknown as LoginRow[]
  const userLoginMap = new Map<string, { last: string; count: number }>()
  for (const row of loginRows) {
    if (!row.profile_id) continue
    const existing = userLoginMap.get(row.profile_id)
    if (!existing) {
      userLoginMap.set(row.profile_id, { last: row.created_at, count: 1 })
    } else {
      existing.count++
      // rows are desc ordered so first occurrence is always the latest
    }
  }
  const userActivity: UserActivityRow[] = authUsers
    .map((u) => {
      const loginData = userLoginMap.get(u.id)
      const profile = profileById.get(u.id)
      const club = profile?.club_id ? clubById.get(profile.club_id) : undefined
      return {
        profile_id: u.id,
        full_name: profile?.full_name ?? null,
        club_name: club?.name ?? null,
        last_login: loginData?.last ?? u.last_sign_in_at ?? null,
        login_count: loginData?.count ?? 0,
      }
    })
    .sort((a, b) => {
      if (!a.last_login && !b.last_login) return 0
      if (!a.last_login) return 1
      if (!b.last_login) return -1
      return b.last_login.localeCompare(a.last_login)
    })

  const aggregateStats: AggregateStats = {
    saalis_count: saalisCount ?? 0,
    bookings_count: bookingsCount ?? 0,
    events_count: eventsCount ?? 0,
    sent_payments_count: sentPaymentsCount ?? 0,
  }

  // ─────────────────────────────────────────────────────────────────────────────

  const subscriptionRows: SubscriptionRow[] = ((subscriptionsRaw ?? []) as unknown as SubscriptionRaw[]).map(
    (s) => ({
      id: s.id,
      club_id: s.club_id,
      club_name: s.clubs?.name ?? null,
      status: s.status,
      trial_starts_at: s.trial_starts_at,
      trial_ends_at: s.trial_ends_at,
      activated_at: s.activated_at,
      created_at: s.created_at,
    })
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-green-500">
            Superadmin
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Hallintapaneeli</h1>
        </div>

        <SuperadminTabs
          stats={{ totalClubs, totalUsers, newThisWeek, activeToday }}
          userRows={userRows}
          enhancedClubs={enhancedClubs}
          feedbackRows={feedbackRows}
          unreadFeedbackCount={unreadFeedbackCount}
          currentUserId={user.id}
          subscriptions={subscriptionRows}
          dailyActivity={dailyActivity}
          pageStats={pageStats}
          userActivity={userActivity}
          aggregateStats={aggregateStats}
          clubs={enhancedClubs.map((c) => ({ id: c.id, name: c.name ?? '' }))}
        />
      </div>
    </main>
  )
}
