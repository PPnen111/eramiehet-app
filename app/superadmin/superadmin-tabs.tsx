'use client'

import { useState } from 'react'
import AnalyticsTab from './analytics-tab'
import InfoTab from './info-tab'
import type { Stats, UserRow, EnhancedClub } from './analytics-tab'

interface Props {
  stats: Stats
  userRows: UserRow[]
  enhancedClubs: EnhancedClub[]
}

type Tab = 'analytics' | 'info'

export default function SuperadminTabs({ stats, userRows, enhancedClubs }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('analytics')

  return (
    <div>
      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 rounded-xl border border-green-800 bg-white/5 p-1">
        {([
          { id: 'analytics', label: 'Analytiikka' },
          { id: 'info', label: 'Tietoa sovelluksesta' },
        ] as { id: Tab; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
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
      {activeTab === 'analytics' ? (
        <AnalyticsTab stats={stats} userRows={userRows} enhancedClubs={enhancedClubs} />
      ) : (
        <InfoTab />
      )}
    </div>
  )
}
