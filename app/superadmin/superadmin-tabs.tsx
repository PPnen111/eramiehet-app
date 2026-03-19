'use client'

import { useState } from 'react'
import AnalyticsTab from './analytics-tab'
import InfoTab from './info-tab'
import LandingV1 from './landing-v1'
import LandingV2 from './landing-v2'
import type { Stats, UserRow, EnhancedClub } from './analytics-tab'

interface Props {
  stats: Stats
  userRows: UserRow[]
  enhancedClubs: EnhancedClub[]
}

type Tab = 'analytics' | 'info' | 'landing-v1' | 'landing-v2'

const TABS: { id: Tab; label: string }[] = [
  { id: 'analytics', label: 'Analytiikka' },
  { id: 'info', label: 'Tietoa sovelluksesta' },
  { id: 'landing-v1', label: 'Landing V1 — Tumma' },
  { id: 'landing-v2', label: 'Landing V2 — Vaalea' },
]

export default function SuperadminTabs({ stats, userRows, enhancedClubs }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('analytics')

  return (
    <div>
      {/* Tab navigation */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-green-800 bg-white/5 p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-green-700 text-white'
                : 'text-green-400 hover:bg-white/10 hover:text-green-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'analytics' && (
        <AnalyticsTab stats={stats} userRows={userRows} enhancedClubs={enhancedClubs} />
      )}
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
