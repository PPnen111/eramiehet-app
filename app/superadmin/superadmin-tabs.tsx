'use client'

import { useState } from 'react'
import AnalyticsTab from './analytics-tab'
import InfoTab from './info-tab'
import LandingV1 from './landing-v1'
import LandingV2 from './landing-v2'
import FeedbackTab from './feedback-tab'
import SubscriptionsTab from './subscriptions-tab'
import UsageTab from './usage-tab'
import CreateUserForm from './create-user-form'
import type { Stats, UserRow, EnhancedClub } from './analytics-tab'
import type { FeedbackRow } from './feedback-tab'
import type { SubscriptionRow } from './subscriptions-tab'
import type { DailyActivityRow, PageStatRow, UserActivityRow, AggregateStats } from './usage-tab'

interface Props {
  stats: Stats
  userRows: UserRow[]
  enhancedClubs: EnhancedClub[]
  feedbackRows: FeedbackRow[]
  unreadFeedbackCount: number
  currentUserId: string
  subscriptions: SubscriptionRow[]
  dailyActivity: DailyActivityRow[]
  pageStats: PageStatRow[]
  userActivity: UserActivityRow[]
  aggregateStats: AggregateStats
  clubs: { id: string; name: string }[]
}

type Tab = 'analytics' | 'usage' | 'subscriptions' | 'feedback' | 'info' | 'landing-v1' | 'landing-v2'

export default function SuperadminTabs({
  stats,
  userRows,
  enhancedClubs,
  feedbackRows,
  unreadFeedbackCount,
  currentUserId,
  subscriptions,
  dailyActivity,
  pageStats,
  userActivity,
  aggregateStats,
  clubs,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('analytics')

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'analytics', label: 'Analytiikka' },
    { id: 'usage', label: 'Käyttöanalyysi 📊' },
    { id: 'subscriptions', label: 'Tilaukset' },
    { id: 'feedback', label: 'Palautteet 💬', badge: unreadFeedbackCount },
    { id: 'info', label: 'Tietoa sovelluksesta' },
    { id: 'landing-v1', label: 'Landing V1 — Tumma' },
    { id: 'landing-v2', label: 'Landing V2 — Vaalea' },
  ]

  return (
    <div>
      {/* Tab navigation */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-green-800 bg-white/5 p-1">
        {TABS.map(({ id, label, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`relative flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-green-700 text-white'
                : 'text-green-400 hover:bg-white/10 hover:text-green-300'
            }`}
          >
            {label}
            {badge != null && badge > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-xs font-bold text-yellow-900">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'analytics' && (
        <>
          <CreateUserForm clubs={clubs} />
          <AnalyticsTab stats={stats} userRows={userRows} enhancedClubs={enhancedClubs} currentUserId={currentUserId} />
        </>
      )}
      {activeTab === 'usage' && (
        <UsageTab
          dailyActivity={dailyActivity}
          pageStats={pageStats}
          userActivity={userActivity}
          aggregateStats={aggregateStats}
        />
      )}
      {activeTab === 'subscriptions' && <SubscriptionsTab subscriptions={subscriptions} />}
      {activeTab === 'feedback' && <FeedbackTab rows={feedbackRows} />}
      {activeTab === 'info' && <InfoTab />}
      {activeTab === 'landing-v1' && (
        <div className="overflow-hidden rounded-2xl border border-green-800 shadow-2xl">
          <LandingV1 />
        </div>
      )}
      {activeTab === 'landing-v2' && (
        <div className="overflow-hidden rounded-2xl border border-stone-300 shadow-2xl">
          <LandingV2 />
        </div>
      )}
    </div>
  )
}
