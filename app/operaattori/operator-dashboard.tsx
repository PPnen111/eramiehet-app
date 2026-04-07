'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Users, TrendingUp, Bell, Map,
  Building2, Pencil, Trash2, Plus, X, ChevronLeft, MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/format'
import GrowthStrategy from '@/app/kehitys/growth-strategy'

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
  last_active: string | null
  notes: { note: string; created_at: string }[]
}

type KPI = {
  active_clubs: number
  total_members: number
  trial_count: number
  signup_count: number
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

type Tab = 'overview' | 'clubs' | 'pipeline' | 'signups' | 'strategy'

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
  const [clubs, setClubs] = useState<Club[]>([])
  const [kpi, setKpi] = useState<KPI>({ active_clubs: 0, total_members: 0, trial_count: 0, signup_count: 0 })
  const [pipeline, setPipeline] = useState<PipelineEntry[]>([])
  const [signups, setSignups] = useState<Signup[]>([])
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
    const [clubsRes, pipeRes, signupsRes] = await Promise.all([
      fetch('/api/operator/clubs'),
      fetch('/api/operator/pipeline'),
      fetch('/api/operator/signups').catch(() => null),
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

        {/* ═══ TAB: OVERVIEW ═══ */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Aktiiviset seurat', value: kpi.active_clubs },
                { label: 'Jäseniä yhteensä', value: kpi.total_members },
                { label: 'Trialissa', value: kpi.trial_count },
                { label: 'Kiinnostusilmoitukset', value: kpi.signup_count },
              ].map((k, i) => (
                <div key={i} className="rounded-xl border border-green-800 bg-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-white">{k.value}</p>
                  <p className="mt-1 text-xs text-green-500">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Club activity */}
              <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
                  Seurojen aktiviteetti (30 pv)
                </h3>
                <div className="space-y-2">
                  {clubs.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-green-900/40 bg-white/[0.02] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${
                          c.activity_30d >= 100 ? 'bg-green-400' : c.activity_30d > 0 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <span className="text-sm text-white">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-400">{c.activity_30d} tapahtumaa</span>
                        {c.last_active && (
                          <span className="text-green-600">{formatDate(c.last_active)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {clubs.length === 0 && <p className="text-sm text-green-600">Ei seuroja.</p>}
                </div>
              </div>

              {/* Pipeline summary */}
              <div className="rounded-2xl border border-green-800 bg-white/5 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
                  Myyntiputki
                </h3>
                <div className="space-y-2">
                  {pipelineCounts.map((s) => (
                    <div key={s.value} className="flex items-center justify-between rounded-lg border border-green-900/40 bg-white/[0.02] px-3 py-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                      <span className="text-sm font-semibold text-white">{s.count}</span>
                    </div>
                  ))}
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
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Tila</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Trial päättyy</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Aktiviteetti 30pv</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Viim. aktiivinen</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Muistiinpanot</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map((c) => {
                    const trialDanger = c.trial_ends_at && c.trial_ends_at.slice(0, 10) < today
                    const trialWarn = c.trial_ends_at && !trialDanger && c.trial_ends_at.slice(0, 10) <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
                    return (
                      <tr key={c.id} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                        <td className="px-3 py-2.5 font-medium text-white">{c.name}</td>
                        <td className="px-3 py-2.5 text-center text-green-300">{c.member_count}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-xs font-semibold ${subStatusCls(c.subscription_status)}`}>
                            {c.subscription_status ?? '—'}
                          </span>
                        </td>
                        <td className={`px-3 py-2.5 text-center text-xs ${trialDanger ? 'text-red-400 font-semibold' : trialWarn ? 'text-amber-400' : 'text-green-500'}`}>
                          {c.trial_ends_at ? formatDate(c.trial_ends_at) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-center text-green-300">{c.activity_30d}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-green-500">
                          {c.last_active ? formatDate(c.last_active) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => { setNotesClubId(c.id); setNewNote('') }}
                            className="rounded-md p-1 text-green-600 hover:bg-green-900/40 hover:text-green-300 transition-colors"
                            title="Muistiinpanot"
                          >
                            <MessageSquare size={14} />
                          </button>
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
        {tab === 'pipeline' && (
          <div className="space-y-4">
            <button
              onClick={() => openNewPipeline()}
              className="flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
            >
              <Plus size={15} />
              Uusi prospekti
            </button>

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
        )}

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
