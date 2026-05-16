'use client'

import { useState } from 'react'
import TabMembers from './tab-members'
import TabPayments from './tab-payments'
import TabDocuments from './tab-documents'
import TabBookings from './tab-bookings'
import TabRentalLocations from './tab-rental-locations'
import TabGroups from './tab-groups'
import TabClubInfo from './tab-club-info'
import TabPlan from './tab-plan'
import type { AdminMember } from './page'

type Tab = 'jasenet' | 'maksut' | 'dokumentit' | 'varaukset' | 'kohteet' | 'ryhmat' | 'seuran-tiedot' | 'paketti'

const tabs: { id: Tab; label: string }[] = [
  { id: 'jasenet', label: 'Jäsenet' },
  { id: 'maksut', label: 'Maksut' },
  { id: 'varaukset', label: 'Varaukset' },
  { id: 'kohteet', label: 'Vuokrattavat' },
  { id: 'dokumentit', label: 'Dokumentit' },
  { id: 'ryhmat', label: 'Ryhmät' },
  { id: 'seuran-tiedot', label: 'Seuran tiedot' },
  { id: 'paketti', label: 'Paketti' },
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
      <div className="flex gap-1 rounded-xl border border-[#e0d8cc] bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              active === t.id
                ? 'bg-[#1e3d1e] text-white'
                : 'text-[#2d6a2d] hover:text-[#1a1a1a]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'jasenet' && <TabMembers clubId={clubId} initialMembers={initialMembers} />}
      {active === 'maksut' && <TabPayments clubId={clubId} />}
      {active === 'varaukset' && <TabBookings clubId={clubId} />}
      {active === 'kohteet' && <TabRentalLocations clubId={clubId} />}
      {active === 'dokumentit' && <TabDocuments clubId={clubId} />}
      {active === 'ryhmat' && <TabGroups clubId={clubId} clubMembers={clubMembers} isAdmin={isAdmin} />}
      {active === 'seuran-tiedot' && <TabClubInfo clubId={clubId} />}
      {active === 'paketti' && <TabPlan clubId={clubId} />}
    </div>
  )
}
