'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/format'

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
  active: { label: 'Aktiivinen', cls: 'bg-green-800 text-green-200' },
  trial: { label: 'Kokeilu', cls: 'bg-amber-900 text-amber-200' },
  expired: { label: 'Vanhentunut', cls: 'bg-red-900 text-red-200' },
}

const PLANS = [
  { plan: 'start', label: 'Jahti Start', price: '225 €/v', members: 50, locations: 1, docs: 10, groups: 2, admins: 1 },
  { plan: 'plus', label: 'Jahti Plus', price: '395 €/v', members: 150, locations: 3, docs: 50, groups: 5, admins: 3 },
  { plan: 'pro', label: 'Jahti Pro', price: '625 €/v', members: '∞', locations: '∞', docs: '∞', groups: '∞', admins: '∞' },
]

function UsageBar({ item, label }: { item: UsageItem; label: string }) {
  const barColor = item.percent >= 90 ? 'bg-red-500' : item.percent >= 70 ? 'bg-amber-500' : 'bg-green-500'
  const displayLimit = item.limit >= 9999 ? '∞' : item.limit

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-green-300">{label}</span>
        <span className="text-white font-medium">{item.current} / {displayLimit}</span>
      </div>
      <div className="h-2 rounded-full bg-green-900/40 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(item.percent, 100)}%` }} />
      </div>
      {item.percent >= 90 && item.percent < 100 && (
        <p className="text-[10px] text-amber-400">Lähestyt pakettisi rajaa</p>
      )}
      {item.percent >= 100 && (
        <p className="text-[10px] text-red-400">Raja täynnä — päivitä paketti</p>
      )}
    </div>
  )
}

interface Props { clubId: string; clubName?: string }

export default function TabPlan({ clubId, clubName }: Props) {
  const [data, setData] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/club/plan-usage')
    if (res.ok) setData((await res.json()) as PlanData)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) return <p className="text-sm text-green-500">Ladataan...</p>
  if (!data) return <p className="text-sm text-red-400">Virhe ladattaessa pakettitietoja.</p>

  const status = STATUS_LABEL[data.status] ?? STATUS_LABEL.trial
  const trialDays = data.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null
  const priceEur = data.price_per_year_cents > 0 ? `${(data.price_per_year_cents / 100).toFixed(0)} €/vuosi` : 'Ilmainen kokeilu'

  return (
    <div className="space-y-6">
      {/* Plan header */}
      <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h2 className="text-lg font-bold text-white">{data.plan_label}</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>
            {status.label}
            {data.status === 'trial' && trialDays !== null && ` — ${trialDays} päivää jäljellä`}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-green-400">
          <span>{priceEur}</span>
          {data.subscription_ends_at && <span>Uusitaan: {formatDate(data.subscription_ends_at)}</span>}
          {data.status === 'trial' && data.trial_ends_at && <span>Kokeilu päättyy: {formatDate(data.trial_ends_at)}</span>}
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-green-400">Käyttö paketista</h3>
        <div className="space-y-4">
          {Object.entries(data.usage).map(([key, item]) => (
            <UsageBar key={key} item={item as UsageItem} label={RESOURCE_LABELS[key] ?? key} />
          ))}
        </div>
      </div>

      {/* Plan comparison */}
      <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-green-400">Paketit</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-green-800">
                <th className="px-3 py-2 text-left text-xs text-green-400">Ominaisuus</th>
                {PLANS.map((p) => (
                  <th key={p.plan} className={`px-3 py-2 text-center text-xs ${data.plan === p.plan ? 'text-white font-bold' : 'text-green-400'}`}>
                    {p.label}
                    {data.plan === p.plan && <span className="ml-1 text-green-400">●</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-green-300">
              <tr className="border-b border-green-900/30"><td className="px-3 py-2">Hinta</td>{PLANS.map((p) => <td key={p.plan} className="px-3 py-2 text-center">{p.price}</td>)}</tr>
              <tr className="border-b border-green-900/30"><td className="px-3 py-2">Jäseniä</td>{PLANS.map((p) => <td key={p.plan} className="px-3 py-2 text-center">{p.members}</td>)}</tr>
              <tr className="border-b border-green-900/30"><td className="px-3 py-2">Vuokratilat</td>{PLANS.map((p) => <td key={p.plan} className="px-3 py-2 text-center">{p.locations}</td>)}</tr>
              <tr className="border-b border-green-900/30"><td className="px-3 py-2">Dokumentit</td>{PLANS.map((p) => <td key={p.plan} className="px-3 py-2 text-center">{p.docs}</td>)}</tr>
              <tr className="border-b border-green-900/30"><td className="px-3 py-2">Ryhmät</td>{PLANS.map((p) => <td key={p.plan} className="px-3 py-2 text-center">{p.groups}</td>)}</tr>
              <tr><td className="px-3 py-2">Ylläpitäjät</td>{PLANS.map((p) => <td key={p.plan} className="px-3 py-2 text-center">{p.admins}</td>)}</tr>
            </tbody>
          </table>
        </div>

        {data.plan !== 'pro' && (
          <div className="mt-4 text-center">
            <a
              href={`mailto:info@jahtipro.fi?subject=${encodeURIComponent(`Pakettipäivitys — ${clubName ?? 'Seura'}`)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
            >
              Päivitä pakettiin →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
