'use client'

import { useState } from 'react'
import TabMembers from './tab-members'
import TabPayments from './tab-payments'
import TabDocuments from './tab-documents'
import TabBookings from './tab-bookings'
import TabGroups from './tab-groups'
import TabClubInfo from './tab-club-info'
import type { AdminMember } from './page'

type Tab = 'jasenet' | 'maksut' | 'dokumentit' | 'varaukset' | 'ryhmat' | 'seuran-tiedot'

const tabs: { id: Tab; label: string }[] = [
  { id: 'jasenet', label: 'Jäsenet' },
  { id: 'maksut', label: 'Maksut' },
  { id: 'varaukset', label: 'Varaukset' },
  { id: 'dokumentit', label: 'Dokumentit' },
  { id: 'ryhmat', label: 'Ryhmät' },
  { id: 'seuran-tiedot', label: 'Seuran tiedot' },
]

interface Props {
  clubId: string
  initialMembers: AdminMember[]
  isAdmin: boolean
}

export default function AdminPanel({ clubId, initialMembers, isAdmin }: Props) {
  const [active, setActive] = useState<Tab>('jasenet')

  const clubMembers = initialMembers
    .filter((m) => m.member_status === 'active')
    .map((m) => ({ id: m.id, full_name: m.full_name, email: m.email }))

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

      {active === 'jasenet' && <TabMembers clubId={clubId} initialMembers={initialMembers} />}
      {active === 'maksut' && <TabPayments clubId={clubId} />}
      {active === 'varaukset' && <TabBookings clubId={clubId} />}
      {active === 'dokumentit' && <TabDocuments clubId={clubId} />}
      {active === 'ryhmat' && <TabGroups clubId={clubId} clubMembers={clubMembers} isAdmin={isAdmin} />}
      {active === 'seuran-tiedot' && <TabClubInfo clubId={clubId} />}
    </div>
  )
}
