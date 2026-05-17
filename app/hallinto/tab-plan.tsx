'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDate } from '@/lib/format'
import { calculatePrice, PRICING, KYYJARVI_CLUB_ID } from '@/lib/pricing'

type UsageItem = { current: number; limit: number; percent: number }
type PlanData = {
  plan: string
  plan_label: string
  status: string
  trial_ends_at: string | null
  subscription_ends_at: string | null
  price_per_year_cents: number
  usage: Record<string, UsageItem>
}

const RESOURCE_LABELS: Record<string, string> = {
  members: 'Jäsenet',
  rental_locations: 'Vuokrattavat tilat',
  documents: 'Dokumentit',
  groups: 'Ryhmät',
  admins: 'Ylläpitäjät',
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active: { label: 'Aktiivinen', cls: 'bg-[#eaf3de] text-[#3b6d11]' },
  trial: { label: 'Kokeilu', cls: 'bg-[#fef3c7] text-[#92400e]' },
  expired: { label: 'Vanhentunut', cls: 'bg-[#fef2f2] text-[#991b1b]' },
}

interface Props { clubId: string; clubName?: string }

export default function TabPlan({ clubId, clubName: _clubName }: Props) {
  const [data, setData] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/club/plan-usage')
    if (res.ok) setData((await res.json()) as PlanData)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) return <p className="text-sm text-[#4a4a4a]">Ladataan...</p>
  if (!data) return <p className="text-sm text-[#991b1b]">Virhe ladattaessa pakettitietoja.</p>

  const status = STATUS_LABEL[data.status] ?? STATUS_LABEL.trial
  const trialDays = data.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null

  const memberCount = data.usage.members?.current ?? 0
  const annualPrice = calculatePrice(memberCount)
  const isKyyjarvi = clubId === KYYJARVI_CLUB_ID

  return (
    <div className="space-y-6">
      {/* Plan header */}
      <div className="card-shadow rounded-2xl bg-white p-5">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h2 className="text-lg font-bold tracking-tight text-[#1a1a1a]">JahtiPro</h2>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.cls}`}>
            {status.label}
            {data.status === 'trial' && trialDays !== null && ` — ${trialDays} päivää jäljellä`}
          </span>
        </div>

        {isKyyjarvi ? (
          <p className="text-sm text-[#3b6d11]">JahtiPro ✓ Aktiivinen</p>
        ) : (
          <>
            <p className="text-sm text-[#2d6a2d]">
              {PRICING.base} € + {PRICING.perMember} € / jäsen / vuosi
            </p>
            <p className="text-xs text-[#888888]">Maksimi {PRICING.max} € / vuosi</p>
            <p className="text-xs text-[#888888]">Hinnat {PRICING.vatNote}</p>

            <div className="mt-4 rounded-xl bg-[#f0ebe3] px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-[#888888]">
                Teidän seuran hinta tällä hetkellä
              </p>
              <p className="mt-1 text-base text-[#1a1a1a]">
                <span className="font-semibold">{memberCount}</span> jäsentä →{' '}
                <span className="font-bold tracking-tight">{annualPrice} €/vuosi</span>
              </p>
              <p className="mt-0.5 text-[10px] text-[#888888]">{PRICING.vatNote}</p>
            </div>

            <p className="mt-3 text-xs text-[#4a4a4a]">Kaikki ominaisuudet sisältyvät hintaan.</p>

            {data.subscription_ends_at && (
              <p className="mt-2 text-xs text-[#888888]">
                Uusitaan: {formatDate(data.subscription_ends_at)}
              </p>
            )}
            {data.status === 'trial' && data.trial_ends_at && (
              <p className="mt-2 text-xs text-[#888888]">
                Kokeilu päättyy: {formatDate(data.trial_ends_at)}
              </p>
            )}
          </>
        )}
      </div>

      {/* Usage */}
      {!isKyyjarvi && (
        <div className="card-shadow rounded-2xl bg-white p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#2d6a2d]">
            Käyttö
          </h3>
          <div className="space-y-3">
            {Object.entries(data.usage).map(([key, item]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-[#1e3d1e]">{RESOURCE_LABELS[key] ?? key}</span>
                <span className="text-[#1a1a1a] font-medium">{item.current}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
