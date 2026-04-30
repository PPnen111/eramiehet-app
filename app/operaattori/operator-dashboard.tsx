'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Users, TrendingUp, Bell, Map,
  Building2, Pencil, Trash2, Plus, X, ChevronLeft, MessageSquare, AlertTriangle, Download, Wallet, Shield, Zap, ClipboardList, Check, Mail,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/format'
import GrowthStrategy from '@/app/kehitys/growth-strategy'
import SecurityPlan from '@/app/kehitys/security-plan'
import AutomationPlan from '@/app/kehitys/automation-plan'
import BudgetTab from './budget-tab'
import CrmTab from './crm-tab'
import EmailTab from './email-tab'
import { InfoTooltip } from '@/app/components/info-tooltip'

// ─── Types ──────────────────────────────────────────────────────────────────

type Club = {
  id: string
  name: string
  created_at: string
  member_count: number
  subscription_status: string | null
  plan: string | null
  trial_ends_at: string | null
  activity_30d: number
  activity_7d: number
  activity_weeks: [number, number, number, number]
  last_active: string | null
  notes: { note: string; created_at: string }[]
}

type KPI = {
  active_clubs: number
  total_members: number
  trial_count: number
  trial_expiring_14d: number
  signup_count: number
  signups_this_week: number
}

type HealthStatus = 'terve' | 'tarkkaile' | 'toimenpide'

function trialDaysLeft(c: Club): number | null {
  if (!c.trial_ends_at) return null
  return Math.ceil((new Date(c.trial_ends_at).getTime() - Date.now()) / 86400000)
}

function clubHealth(c: Club): HealthStatus {
  const days = trialDaysLeft(c)
  if (c.activity_30d === 0) return 'toimenpide'
  if (days !== null && days < 7) return 'toimenpide'
  if (c.activity_30d < 100 || (days !== null && days <= 14)) return 'tarkkaile'
  if (c.member_count <= 10) return 'tarkkaile'
  return 'terve'
}

const HEALTH: Record<HealthStatus, { dot: string; label: string; cls: string }> = {
  terve: { dot: 'bg-green-400', label: 'Terve', cls: 'text-green-400' },
  tarkkaile: { dot: 'bg-yellow-400', label: 'Tarkkaile', cls: 'text-yellow-400' },
  toimenpide: { dot: 'bg-red-400', label: 'Toimenpide', cls: 'text-red-400' },
}

function MiniSparkline({ weeks }: { weeks: [number, number, number, number] }) {
  const max = Math.max(...weeks, 1)
  const increasing = weeks[3] >= weeks[0]
  return (
    <div className="flex items-end gap-0.5 h-5" title={`Viikot: ${weeks.join(', ')}`}>
      {weeks.map((w, i) => (
        <div
          key={i}
          className={`w-2 rounded-sm ${increasing ? 'bg-green-500' : 'bg-stone-500'}`}
          style={{ height: `${Math.max((w / max) * 100, 8)}%` }}
          title={`${w}`}
        />
      ))}
    </div>
  )
}

type PipelineEntry = {
  id: string
  club_name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  status: string
  source: string | null
  estimated_members: number | null
  notes: string | null
  next_action: string | null
  next_action_date: string | null
  created_at: string
  updated_at: string | null
}

type Signup = {
  id: string
  email: string
  club_name: string | null
  created_at: string
}

type SummaryAlert = { type: string; message: string; severity: 'critical' | 'warning'; action: string; actionTab?: string; clubId?: string }
type SummaryFeed = { icon: string; message: string; time: string }
type Summary = {
  clubs: { total: number; trial: number; active: number; expiring_14d: number }
  members: { total: number }
  pipeline: { total: number; leads: number; won_this_month: number; conversion_rate: number }
  payments: { pending: number; overdue: number; paid_this_month: number }
  signups: { total: number; new_48h: number }
  audit: { events_24h: number; denied_24h: number }
  mrr: number
  top_club: { name: string; count: number }
  alerts: SummaryAlert[]
  feed: SummaryFeed[]
}

type Tab = 'overview' | 'clubs' | 'pipeline' | 'signups' | 'registrations' | 'budget' | 'crm' | 'emails' | 'security' | 'automation' | 'strategy'

type Registration = {
  id: string
  club_name: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  estimated_members: number | null
  has_cabin: boolean
  status: string
  promo_code: string | null
  created_at: string
}

const PIPELINE_STATUSES = [
  { value: 'lead', label: 'Lead', cls: 'bg-stone-700 text-stone-200' },
  { value: 'contacted', label: 'Contacted', cls: 'bg-blue-900 text-blue-200' },
  { value: 'demo_booked', label: 'Demo booked', cls: 'bg-purple-900 text-purple-200' },
  { value: 'demo_done', label: 'Demo done', cls: 'bg-indigo-900 text-indigo-200' },
  { value: 'trial', label: 'Trial', cls: 'bg-amber-900 text-amber-200' },
  { value: 'negotiating', label: 'Negotiating', cls: 'bg-orange-900 text-orange-200' },
  { value: 'won', label: 'Won', cls: 'bg-green-800 text-green-200' },
  { value: 'lost', label: 'Lost', cls: 'bg-red-900 text-red-200' },
]

const SOURCES = [
  { value: 'launch_signup', label: 'Launch signup' },
  { value: 'referral', label: 'Referral' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'event', label: 'Event' },
  { value: 'muu', label: 'Muu' },
]

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'juuri nyt'
  if (m < 60) return `${m} min sitten`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} t sitten`
  const d = Math.floor(h / 24)
  return `${d} pv sitten`
}

const statusBadge = (status: string) => {
  const s = PIPELINE_STATUSES.find((p) => p.value === status)
  return s ? s.cls : 'bg-stone-700 text-stone-200'
}

const subStatusCls = (status: string | null) => {
  if (status === 'active') return 'text-green-400'
  if (status === 'trial') return 'text-amber-400'
  return 'text-red-400'
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function OperatorDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [kpi, setKpi] = useState<KPI>({ active_clubs: 0, total_members: 0, trial_count: 0, trial_expiring_14d: 0, signup_count: 0, signups_this_week: 0 })
  const [pipeline, setPipeline] = useState<PipelineEntry[]>([])
  const [signups, setSignups] = useState<Signup[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [approveBusy, setApproveBusy] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Pipeline form
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string | number | null>>({})
  const [formBusy, setFormBusy] = useState(false)

  // Notes panel
  const [notesClubId, setNotesClubId] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [noteBusy, setNoteBusy] = useState(false)

  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [clubsRes, pipeRes, signupsRes, summaryRes, regsRes] = await Promise.all([
      fetch('/api/operator/clubs'),
      fetch('/api/operator/pipeline'),
      fetch('/api/operator/signups').catch(() => null),
      fetch('/api/operator/summary').catch(() => null),
      fetch('/api/operator/registrations').catch(() => null),
    ])

    if (clubsRes.ok) {
      const d = (await clubsRes.json()) as { clubs: Club[]; kpi: KPI }
      setClubs(d.clubs)
      setKpi(d.kpi)
    }
    if (pipeRes.ok) {
      const d = (await pipeRes.json()) as { entries: PipelineEntry[] }
      setPipeline(d.entries)
    }
    if (signupsRes?.ok) {
      const d = (await signupsRes.json()) as { signups: Signup[] }
      setSignups(d.signups)
    }
    if (summaryRes?.ok) {
      const d = (await summaryRes.json()) as Summary
      setSummary(d)
    }
    if (regsRes?.ok) {
      const d = (await regsRes.json()) as { registrations: Registration[] }
      setRegistrations(d.registrations)
    }
    setLoading(false)
  }, [])

  useEffect(() => { void loadAll() }, [loadAll])

  // ── Pipeline CRUD ─────────────────────────────────────────────

  const openNewPipeline = (prefill?: Record<string, string | null>) => {
    setEditingId(null)
    setForm({
      club_name: '', contact_name: '', contact_email: '', contact_phone: '',
      status: 'lead', source: '', estimated_members: null,
      notes: '', next_action: '', next_action_date: '',
      ...prefill,
    })
    setFormOpen(true)
  }

  const openEditPipeline = (e: PipelineEntry) => {
    setEditingId(e.id)
    setForm({
      club_name: e.club_name,
      contact_name: e.contact_name ?? '',
      contact_email: e.contact_email ?? '',
      contact_phone: e.contact_phone ?? '',
      status: e.status,
      source: e.source ?? '',
      estimated_members: e.estimated_members,
      notes: e.notes ?? '',
      next_action: e.next_action ?? '',
      next_action_date: e.next_action_date ?? '',
    })
    setFormOpen(true)
  }

  const savePipeline = async () => {
    setFormBusy(true)
    const url = editingId ? `/api/operator/pipeline/${editingId}` : '/api/operator/pipeline'
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        estimated_members: form.estimated_members ? Number(form.estimated_members) : null,
        next_action_date: form.next_action_date || null,
      }),
    })
    setFormBusy(false)
    if (res.ok) {
      showToast(editingId ? 'Prospekti päivitetty' : 'Prospekti lisätty')
      setFormOpen(false)
      void loadAll()
    }
  }

  const deletePipeline = async (id: string) => {
    if (!confirm('Haluatko varmasti poistaa tämän prospektin?')) return
    await fetch(`/api/operator/pipeline/${id}`, { method: 'DELETE' })
    showToast('Prospekti poistettu')
    void loadAll()
  }

  const updatePipelineStatus = async (id: string, status: string) => {
    await fetch(`/api/operator/pipeline/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setPipeline((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  // ── Notes ─────────────────────────────────────────────────────

  const saveNote = async () => {
    if (!notesClubId || !newNote.trim()) return
    setNoteBusy(true)
    await fetch('/api/operator/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ club_id: notesClubId, note: newNote.trim() }),
    })
    setNoteBusy(false)
    setNewNote('')
    showToast('Muistiinpano tallennettu')
    void loadAll()
  }

  // ── Approve registration ───────────────────────────────────────

  const approveRegistration = async (regId: string) => {
    setApproveBusy(regId)
    const res = await fetch(`/api/operator/approve-registration/${regId}`, { method: 'POST' })
    setApproveBusy(null)
    if (res.ok) {
      showToast('Seura aktivoitu ja tervetuloviesti lähetetty!')
      void loadAll()
    } else {
      const d = (await res.json()) as { error?: string }
      showToast(d.error ?? 'Hyväksyntä epäonnistui')
    }
  }

  // ── Remind ────────────────────────────────────────────────────

  const [remindBusy, setRemindBusy] = useState<string | null>(null)
  const [bulkRemindBusy, setBulkRemindBusy] = useState(false)
  const [reportBusy, setReportBusy] = useState(false)

  const sendRemind = async (clubId: string) => {
    setRemindBusy(clubId)
    const res = await fetch(`/api/operator/remind/${clubId}`, { method: 'POST' })
    setRemindBusy(null)
    if (res.ok) {
      const d = (await res.json()) as { club_name: string }
      showToast(`Muistutus lähetetty: ${d.club_name}`)
    } else {
      showToast('Lähetys epäonnistui')
    }
  }

  const sendBulkRemind = async () => {
    const targets = clubs.filter((c) => {
      const days = trialDaysLeft(c)
      return days !== null && days < 14 && c.activity_7d === 0
    })
    if (targets.length === 0) { showToast('Ei kohteita'); return }
    if (!confirm(`Lähetetään muistutus ${targets.length} seuralle, jatketaan?`)) return
    setBulkRemindBusy(true)
    for (const c of targets) {
      await fetch(`/api/operator/remind/${c.id}`, { method: 'POST' })
    }
    setBulkRemindBusy(false)
    showToast(`Muistutus lähetetty ${targets.length} seuralle`)
  }

  const downloadCsv = () => {
    const header = 'Seuran nimi,Jäseniä,Trial päättyy,Aktiviteetti 30pv,Tila\n'
    const rows = clubs.map((c) =>
      `"${c.name}",${c.member_count},${c.trial_ends_at?.slice(0, 10) ?? ''},${c.activity_30d},${c.subscription_status ?? ''}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jahtipro-seurat-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sendMorningReport = async () => {
    setReportBusy(true)
    const res = await fetch('/api/cron/morning-report', { method: 'POST' })
    setReportBusy(false)
    if (res.ok) showToast('Aamuraportti lähetetty sähköpostiin')
    else showToast('Lähetys epäonnistui')
  }

  // ── Render helpers ────────────────────────────────────────────

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const selectCls = 'w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-xs text-green-400'

  const today = new Date().toISOString().slice(0, 10)
  const pipelineCounts = PIPELINE_STATUSES.map((s) => ({
    ...s,
    count: pipeline.filter((p) => p.status === s.value).length,
  }))

  const tabBtn = (t: Tab, label: string, icon: React.ReactNode, badge?: number) => (
    <button
      onClick={() => setTab(t)}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        tab === t ? 'bg-green-700 text-white' : 'text-green-400 hover:bg-white/10'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>
      )}
    </button>
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <p className="text-green-500">Ladataan...</p>
      </main>
    )
  }

  const notesClub = clubs.find((c) => c.id === notesClubId)

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950">
      <div className="px-4 pt-6 pb-4">
        <Link href="/dashboard" className="mb-3 flex items-center gap-1 text-sm text-green-400 hover:text-green-300">
          <ChevronLeft className="h-4 w-4" />
          Takaisin
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <Building2 size={22} className="text-green-400" />
          <h1 className="text-xl font-bold text-white">JahtiPro Operaattori</h1>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-green-800 bg-white/5 p-1">
          {tabBtn('overview', 'Yleiskatsaus', <LayoutDashboard size={14} />)}
          {tabBtn('clubs', 'Seurat', <Users size={14} />)}
          {tabBtn('pipeline', 'Myyntiputki', <TrendingUp size={14} />)}
          {tabBtn('signups', 'Kiinnostusilmoitukset', <Bell size={14} />, signups.length)}
          {tabBtn('registrations', 'Rekisteröitymiset', <ClipboardList size={14} />, registrations.filter((r) => r.status === 'pending').length)}
          {tabBtn('crm', 'CRM', <Users size={14} />)}
          {tabBtn('emails', 'Sähköpostit', <Mail size={14} />)}
          {tabBtn('budget', 'Talous', <Wallet size={14} />)}
          {tabBtn('security', 'Tietoturva & GDPR', <Shield size={14} />)}
          {tabBtn('automation', 'Automaatiot', <Zap size={14} />)}
          {tabBtn('strategy', 'Strategia', <Map size={14} />)}
        </div>
      </div>

      <div className="px-4 pb-8">
        {/* Toast */}
        {toast && (
          <div className="mb-4 rounded-xl bg-green-800/60 px-4 py-3 text-sm font-medium text-green-200">
            {toast}
          </div>
        )}

        {/* ═══ TAB: OVERVIEW — Command Center ═══ */}
        {tab === 'overview' && summary && (
          <div className="space-y-6">
            {/* SECTION 1 — Alerts */}
            {summary.alerts.length > 0 ? (
              <div className="rounded-2xl border border-red-800/60 bg-red-900/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-red-400" />
                  <h3 className="text-sm font-semibold text-red-300">Toimenpiteet heti <InfoTooltip title="Toimenpiteet heti" content="Automaattisesti havaitut asiat jotka vaativat huomiosi juuri nyt. Päivittyy reaaliajassa." /></h3>
                </div>
                <div className="space-y-2">
                  {summary.alerts.map((a, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${a.severity === 'critical' ? 'border-red-800/60 bg-red-900/20' : 'border-yellow-800/60 bg-yellow-900/10'}`}>
                      <span className="text-sm text-white">{a.message}</span>
                      <button
                        onClick={() => {
                          if (a.clubId) void sendRemind(a.clubId)
                          else if (a.actionTab) setTab(a.actionTab as Tab)
                        }}
                        className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold text-white ${a.severity === 'critical' ? 'bg-red-800 hover:bg-red-700' : 'bg-yellow-800 hover:bg-yellow-700'}`}
                      >
                        {a.clubId && remindBusy === a.clubId ? '...' : a.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-green-700/40 bg-green-900/10 px-4 py-3 text-center">
                <p className="text-sm text-green-300">✅ Kaikki kunnossa — ei kiireellisiä toimenpiteitä</p>
              </div>
            )}

            {/* SECTION 2 — Cards grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Card 1: Asiakkuudet */}
              <button onClick={() => setTab('clubs')} className="rounded-2xl border border-green-800 bg-white/5 p-5 text-left hover:bg-white/[0.07] transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">👥</span>
                  <h3 className="font-semibold text-white">Asiakkuudet <InfoTooltip title="Asiakkuudet" content={['Aktiiviset seurat: seurat joilla on voimassa oleva tilaus', 'Trialissa: seurat jotka käyttävät 14 pv ilmaista kokeilujaksoa', 'Liikennevalot: 🟢 aktiivinen käyttö / 🟡 vähäinen / 🔴 ei käyttöä']} /></h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-green-400">Aktiiviset seurat</span><span className="text-white font-semibold">{summary.clubs.total}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Jäseniä yhteensä</span><span className="text-white font-semibold">{summary.members.total}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Trialissa</span><span className="text-white font-semibold">{summary.clubs.trial}{summary.clubs.expiring_14d > 0 ? ` (${summary.clubs.expiring_14d} päättyy pian)` : ''}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Aktiivisin</span><span className="text-white font-semibold">{summary.top_club.name} ({summary.top_club.count}/30pv)</span></div>
                </div>
                <p className="mt-3 text-xs text-green-500">→ Seurat</p>
              </button>

              {/* Card 2: Myynti & Markkinointi */}
              <button onClick={() => setTab('pipeline')} className="rounded-2xl border border-green-800 bg-white/5 p-5 text-left hover:bg-white/[0.07] transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📈</span>
                  <h3 className="font-semibold text-white">Myynti & Markkinointi <InfoTooltip title="Myynti & Markkinointi" content={['Liidit: mahdolliset asiakkaat jotka ovat osoittaneet kiinnostusta', 'Won: liideistä muuttuneita maksavia asiakkaita', 'Konversio: kuinka moni liideistä on muuttunut asiakkaaksi (%)']} /></h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-green-400">Liidejä</span><span className="text-white font-semibold">{summary.pipeline.leads}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Won tällä kuulla</span><span className="text-white font-semibold">{summary.pipeline.won_this_month}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Kiinnostusilmoitukset</span><span className="text-white font-semibold">{summary.signups.total}{summary.signups.new_48h > 0 ? ` (+${summary.signups.new_48h} uutta)` : ''}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Konversio</span><span className="text-white font-semibold">{summary.pipeline.conversion_rate}%</span></div>
                </div>
                <p className="mt-3 text-xs text-green-500">→ Myyntiputki</p>
              </button>

              {/* Card 3: Talous */}
              <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">💰</span>
                  <h3 className="font-semibold text-white">Talous <InfoTooltip title="Talous" content={['MRR: Monthly Recurring Revenue — kuukausittainen toistuva liikevaihto', 'Avoimet laskut: lähetetyt mutta maksamattomat laskut', 'Myöhässä: eräpäivän ylittäneet maksamattomat laskut']} /></h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-green-400">MRR</span><span className="text-white font-semibold">{summary.mrr > 0 ? `${summary.mrr} €/kk` : 'Trialissa — ei laskutusta vielä'}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Avoimia laskuja</span><span className="text-white font-semibold">{summary.payments.pending}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Myöhässä</span><span className={`font-semibold ${summary.payments.overdue > 0 ? 'text-red-400' : 'text-white'}`}>{summary.payments.overdue}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Maksettu tässä kuussa</span><span className="text-white font-semibold">{summary.payments.paid_this_month}</span></div>
                </div>
              </div>

              {/* Card 4: Järjestelmä */}
              <a href="/kehitys" className="rounded-2xl border border-green-800 bg-white/5 p-5 hover:bg-white/[0.07] transition-colors block">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⚙️</span>
                  <h3 className="font-semibold text-white">Järjestelmä <InfoTooltip title="Järjestelmä" content="Tekninen tila: palvelimet, tietokanta ja sovelluksen toiminta. Supabase Pro = tuotantotason tietokanta. Vercel Pro = nopea hosting." /></h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-green-400">Seurat yhteensä</span><span className="text-white font-semibold">{summary.clubs.total}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Käyttäjiä yhteensä</span><span className="text-white font-semibold">{summary.members.total}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Alusta</span><span className="text-white font-semibold">Next.js + Supabase</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Tietokanta</span><span className="text-green-300 font-semibold">Supabase Pro ✅</span></div>
                </div>
                <p className="mt-3 text-xs text-green-500">→ Kehityssivu</p>
              </a>

              {/* Card 5: Tietoturva & GDPR */}
              <div className="rounded-2xl border border-green-800 bg-white/5 p-5 sm:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔒</span>
                  <h3 className="font-semibold text-white">Tietoturva & GDPR <InfoTooltip title="Tietoturva & GDPR" content={['Tapahtumaloki: kirjaa kaikki tärkeät toiminnot automaattisesti', 'Hylätyt pääsyt: epäonnistuneet kirjautumis- tai käyttöyritykset', 'GDPR-pyynnöt: jäsenten tietopyynöt (tarkastus, poisto jne.)']} /></h3>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  <div className="flex justify-between"><span className="text-green-400">Tapahtumaloki (24h)</span><span className="text-white font-semibold">{summary.audit.events_24h}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Hylättyjä pääsyjä</span><span className={`font-semibold ${summary.audit.denied_24h > 0 ? 'text-red-400' : 'text-white'}`}>{summary.audit.denied_24h}</span></div>
                  <div className="flex justify-between"><span className="text-green-400">GDPR-pyynnöt</span><span className="text-white font-semibold">0 avoinna</span></div>
                  <div className="flex justify-between"><span className="text-green-400">Viimeisin tarkistus</span><span className="text-white font-semibold">{formatDate(new Date().toISOString())}</span></div>
                </div>
              </div>
            </div>

            {/* SECTION 3 — Activity feed + quick actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Feed */}
              <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">Viimeisimmät tapahtumat</h3>
                {summary.feed.length > 0 ? (
                  <div className="space-y-2">
                    {summary.feed.slice(0, 5).map((f, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg border border-green-900/40 bg-white/[0.02] px-3 py-2">
                        <span className="shrink-0">{f.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white">{f.message}</p>
                          <p className="text-xs text-green-600">{relativeTime(f.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-600">Ei viimeaikaisia tapahtumia.</p>
                )}
              </div>

              {/* Quick actions */}
              <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">Pikavalinnat</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={() => { openNewPipeline(); setTab('pipeline') }} className="flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2.5 text-xs font-semibold text-white hover:bg-green-600 transition-colors">
                    <Plus size={13} /> Lisää prospekti
                  </button>
                  <button onClick={() => void sendBulkRemind()} disabled={bulkRemindBusy} className="flex items-center gap-1.5 rounded-lg bg-red-900/60 px-3 py-2.5 text-xs font-semibold text-red-200 hover:bg-red-800/60 disabled:opacity-50 transition-colors">
                    <Bell size={13} /> {bulkRemindBusy ? 'Lähetetään...' : 'Muistutus inaktiivisille'}
                  </button>
                  <button onClick={downloadCsv} className="flex items-center gap-1.5 rounded-lg border border-green-800 px-3 py-2.5 text-xs font-semibold text-green-300 hover:bg-white/5 transition-colors">
                    <Download size={13} /> Lataa raportti (CSV)
                  </button>
                  <button onClick={() => void sendMorningReport()} disabled={reportBusy} className="flex items-center gap-1.5 rounded-lg border border-green-800 px-3 py-2.5 text-xs font-semibold text-green-300 hover:bg-white/5 disabled:opacity-50 transition-colors">
                    <Mail size={13} /> {reportBusy ? 'Lähetetään...' : 'Lähetä aamuraportti nyt'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: CLUBS ═══ */}
        {tab === 'clubs' && (
          <div className="rounded-2xl border border-green-800 bg-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-green-800 bg-green-950">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Seuran nimi</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Jäseniä</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Tila <InfoTooltip title="Liikennevalot" content={['🟢 Terve: yli 100 toimintoa/30pv, yli 10 jäsentä, trial kaukana', '🟡 Tarkkaile: vähäinen käyttö tai trial lähestyy', '🔴 Toimenpide: ei käyttöä, trial päättyy alle 7pv tai jo päättynyt']} /></th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Trial päättyy <InfoTooltip title="Trial päättyy" content="14 päivän ilmainen kokeilujakso. Kun trial päättyy, seura valitsee maksullisen paketin tai käyttö rajoittuu." /></th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Trendi (4vk) <InfoTooltip title="Aktiviteetti" content="Kuinka monta toimintoa (kirjautumiset, sivulataukset, ilmoitukset) seuran jäsenet ovat tehneet viimeisen 30 päivän aikana." /></th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Viim. aktiivinen</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Toiminnot <InfoTooltip title="Muistiinpanot" content="Sisäiset muistiinpanot tästä seurasta — vain sinä näet nämä. Hyödyllinen esim. myyntineuvottelujen seurantaan." /></th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map((c) => {
                    const days = trialDaysLeft(c)
                    const trialDanger = days !== null && days < 0
                    const trialWarn = days !== null && !trialDanger && days <= 7
                    const h = HEALTH[clubHealth(c)]
                    const showRemind = days !== null && days < 14
                    return (
                      <tr key={c.id} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${h.dot}`} />
                            <span className="font-medium text-white">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-green-300">{c.member_count}</td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`text-xs font-semibold ${subStatusCls(c.subscription_status)}`}>
                              {c.subscription_status ?? '—'}
                            </span>
                            <span className={`text-[10px] ${h.cls}`}>{h.label}</span>
                          </div>
                        </td>
                        <td className={`px-3 py-2.5 text-center text-xs ${trialDanger ? 'text-red-400 font-semibold' : trialWarn ? 'text-amber-400' : 'text-green-500'}`}>
                          {c.trial_ends_at ? formatDate(c.trial_ends_at) : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-2">
                            <MiniSparkline weeks={c.activity_weeks} />
                            <span className="text-xs text-green-500">{c.activity_30d}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-green-500">
                          {c.last_active ? formatDate(c.last_active) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {showRemind && (
                              <button
                                onClick={() => void sendRemind(c.id)}
                                disabled={remindBusy === c.id}
                                className="rounded-md p-1 text-amber-500 hover:bg-amber-900/30 hover:text-amber-300 disabled:opacity-40 transition-colors"
                                title="Lähetä trial-muistutus"
                              >
                                <Bell size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => { setNotesClubId(c.id); setNewNote('') }}
                              className="rounded-md p-1 text-green-600 hover:bg-green-900/40 hover:text-green-300 transition-colors"
                              title="Muistiinpanot"
                            >
                              <MessageSquare size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ TAB: PIPELINE ═══ */}
        {tab === 'pipeline' && (() => {
          const wonCount = pipeline.filter((p) => p.status === 'won').length
          const convRate = pipeline.length > 0 ? Math.round((wonCount / pipeline.length) * 100) : 0
          const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
          const addedThisWeek = pipeline.filter((p) => p.created_at >= weekAgo).length
          return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => openNewPipeline()}
                className="flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
              >
                <Plus size={15} />
                Uusi prospekti
              </button>
              <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-green-400">Konversio: {convRate}% <InfoTooltip title="Konversio %" content="Kuinka moni kaikista liideistä on muuttunut maksavaksi asiakkaaksi. Hyvä SaaS-konversio on 10-25%." /></span>
              {addedThisWeek > 0 && <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-green-400">+{addedThisWeek} tällä viikolla</span>}
            </div>

            <div className="rounded-2xl border border-green-800 bg-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-green-800 bg-green-950">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Seura</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Yhteyshenkilö</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Status</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Jäseniä (arv.)</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Seuraava toimenpide</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Muistiinpanot</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Toiminnot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipeline.map((e) => {
                      const overdue = e.next_action_date && e.next_action_date < today
                      return (
                        <tr key={e.id} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                          <td className="px-3 py-2.5 font-medium text-white">{e.club_name}</td>
                          <td className="px-3 py-2.5">
                            <p className="text-white">{e.contact_name ?? '—'}</p>
                            {e.contact_email && <p className="text-xs text-green-500">{e.contact_email}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <select
                              value={e.status}
                              onChange={(ev) => void updatePipelineStatus(e.id, ev.target.value)}
                              className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium outline-none cursor-pointer ${statusBadge(e.status)}`}
                            >
                              {PIPELINE_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5 text-center text-green-300">{e.estimated_members ?? '—'}</td>
                          <td className="px-3 py-2.5">
                            {e.next_action && <p className="text-white text-xs">{e.next_action}</p>}
                            {e.next_action_date && (
                              <p className={`text-xs ${overdue ? 'text-red-400 font-semibold' : 'text-green-500'}`}>
                                {formatDate(e.next_action_date)}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-green-400 max-w-[150px] truncate">{e.notes ?? ''}</td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openEditPipeline(e)} className="rounded-md p-1 text-green-600 hover:text-green-300"><Pencil size={13} /></button>
                              <button onClick={() => void deletePipeline(e.id)} className="rounded-md p-1 text-red-500 hover:text-red-300"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {pipeline.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-green-600">Ei prospekteja.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )
        })()}

        {/* ═══ TAB: SIGNUPS ═══ */}
        {tab === 'signups' && (
          <div className="rounded-2xl border border-green-800 bg-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-green-800 bg-green-950">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Sähköposti</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Seuran nimi</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Ilmoittautunut</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Toimenpiteet</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((s) => (
                    <tr key={s.id} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                      <td className="px-3 py-2.5 text-white">{s.email}</td>
                      <td className="px-3 py-2.5 text-green-300">{s.club_name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-green-500">{formatDate(s.created_at)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => {
                            openNewPipeline({
                              club_name: s.club_name ?? '',
                              contact_email: s.email,
                              status: 'lead',
                              source: 'launch_signup',
                            })
                            setTab('pipeline')
                          }}
                          className="rounded-lg bg-green-800 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          → Myyntiputki
                        </button>
                      </td>
                    </tr>
                  ))}
                  {signups.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-green-600">Ei ilmoittautumisia.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ TAB: REGISTRATIONS ═══ */}
        {tab === 'registrations' && (
          <div className="rounded-2xl border border-green-800 bg-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-green-800 bg-green-950">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Seuran nimi</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Yhteyshenkilö</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Jäseniä</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Eräkartano</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Koodi</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Ilmoittautunut</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Tila</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Toiminnot</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                      <td className="px-3 py-2.5 font-medium text-white">{r.club_name}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-white">{r.contact_name}</p>
                        <p className="text-xs text-green-500">{r.contact_email}</p>
                        {r.contact_phone && <p className="text-xs text-green-600">{r.contact_phone}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-center text-green-300">{r.estimated_members ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center text-xs">{r.has_cabin ? '✅' : '—'}</td>
                      <td className="px-3 py-2.5 text-center text-xs text-green-500">{r.promo_code ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center text-xs text-green-500">{formatDate(r.created_at)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.status === 'approved' ? 'bg-green-800 text-green-200' : r.status === 'rejected' ? 'bg-red-900 text-red-200' : 'bg-amber-900 text-amber-200'
                        }`}>{r.status === 'approved' ? 'Hyväksytty' : r.status === 'rejected' ? 'Hylätty' : 'Odottaa'}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => void approveRegistration(r.id)}
                            disabled={approveBusy === r.id}
                            className="flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50 mx-auto"
                          >
                            <Check size={12} />
                            {approveBusy === r.id ? '...' : 'Hyväksy'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {registrations.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-green-600">Ei rekisteröitymispyyntöjä.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ TAB: CRM ═══ */}
        {tab === 'crm' && <CrmTab />}

        {/* ═══ TAB: EMAILS ═══ */}
        {tab === 'emails' && <EmailTab />}

        {/* ═══ TAB: BUDGET ═══ */}
        {tab === 'budget' && <BudgetTab clubs={clubs.map((c) => ({ id: c.id, name: c.name }))} />}

        {/* ═══ TAB: SECURITY ═══ */}
        {tab === 'security' && <SecurityPlan />}

        {/* ═══ TAB: AUTOMATION ═══ */}
        {tab === 'automation' && <AutomationPlan />}

        {/* ═══ TAB: STRATEGY ═══ */}
        {tab === 'strategy' && <GrowthStrategy />}
      </div>

      {/* ═══ Pipeline form slide-in ═══ */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setFormOpen(false)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-gradient-to-b from-green-950 to-stone-950 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Muokkaa prospektia' : 'Uusi prospekti'}</h2>
              <button onClick={() => setFormOpen(false)} className="rounded-lg p-1.5 text-green-400 hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><label className={labelCls}>Seuran nimi *</label><input type="text" value={(form.club_name as string) ?? ''} onChange={(e) => setForm((f) => ({ ...f, club_name: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Yhteyshenkilön nimi</label><input type="text" value={(form.contact_name as string) ?? ''} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Sähköposti</label><input type="email" value={(form.contact_email as string) ?? ''} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Puhelin</label><input type="tel" value={(form.contact_phone as string) ?? ''} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={(form.status as string) ?? 'lead'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={selectCls}>
                    {PIPELINE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Lähde</label>
                  <select value={(form.source as string) ?? ''} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} className={selectCls}>
                    <option value="">—</option>
                    {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>Arvioitu jäsenmäärä</label><input type="number" value={form.estimated_members ?? ''} onChange={(e) => setForm((f) => ({ ...f, estimated_members: e.target.value ? Number(e.target.value) : null }))} className={inputCls} /></div>
              <div><label className={labelCls}>Muistiinpanot</label><textarea value={(form.notes as string) ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className={inputCls} /></div>
              <div><label className={labelCls}>Seuraava toimenpide</label><input type="text" value={(form.next_action as string) ?? ''} onChange={(e) => setForm((f) => ({ ...f, next_action: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Seuraavan toimenpiteen päivämäärä</label><input type="date" value={(form.next_action_date as string) ?? ''} onChange={(e) => setForm((f) => ({ ...f, next_action_date: e.target.value }))} className={inputCls} /></div>
              <button onClick={() => void savePipeline()} disabled={formBusy || !(form.club_name as string)?.trim()} className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
                {formBusy ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Notes panel ═══ */}
      {notesClubId && notesClub && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setNotesClubId(null)}>
          <div className="h-full w-full max-w-sm overflow-y-auto bg-gradient-to-b from-green-950 to-stone-950 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{notesClub.name}</h3>
              <button onClick={() => setNotesClubId(null)} className="text-green-400 hover:bg-white/10 rounded-lg p-1"><X size={18} /></button>
            </div>
            <div className="space-y-2 mb-4">
              {notesClub.notes.length === 0 && <p className="text-xs text-green-600 italic">Ei muistiinpanoja.</p>}
              {notesClub.notes.map((n, i) => (
                <div key={i} className="rounded-lg border border-green-900 bg-white/[0.03] px-3 py-2">
                  <p className="text-sm text-green-200">{n.note}</p>
                  <p className="mt-1 text-xs text-green-700">{formatDate(n.created_at)}</p>
                </div>
              ))}
            </div>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              placeholder="Lisää muistiinpano..."
              className={inputCls}
            />
            <button
              onClick={() => void saveNote()}
              disabled={noteBusy || !newNote.trim()}
              className="mt-2 w-full rounded-lg bg-green-700 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
            >
              {noteBusy ? 'Tallennetaan...' : 'Tallenna'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
