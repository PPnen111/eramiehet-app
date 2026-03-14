'use client'

import { useState } from 'react'
import TabMembers from './tab-members'
import TabPayments from './tab-payments'
import TabDocuments from './tab-documents'

type Tab = 'jasenet' | 'maksut' | 'dokumentit'

const tabs: { id: Tab; label: string }[] = [
  { id: 'jasenet', label: 'Jäsenet' },
  { id: 'maksut', label: 'Maksut' },
  { id: 'dokumentit', label: 'Dokumentit' },
]

interface Props {
  clubId: string
}

export default function AdminPanel({ clubId }: Props) {
  const [active, setActive] = useState<Tab>('jasenet')

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-green-800 bg-white/5 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              active === t.id
                ? 'bg-green-700 text-white'
                : 'text-green-400 hover:text-green-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'jasenet' && <TabMembers clubId={clubId} />}
      {active === 'maksut' && <TabPayments clubId={clubId} />}
      {active === 'dokumentit' && <TabDocuments clubId={clubId} />}
    </div>
  )
}
