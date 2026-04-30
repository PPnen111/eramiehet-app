'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { formatDate } from '@/lib/format'

type Contact = {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  club_name: string | null
  status: string
  source: string | null
  notes: string | null
  next_action: string | null
  next_action_date: string | null
  created_at: string
}

type Activity = {
  id: string
  contact_id: string
  type: string
  subject: string | null
  body: string | null
  direction: string | null
  created_at: string
  crm_contacts: { name: string; club_name: string | null } | null
}

const STATUSES = [
  { value: 'lead', label: 'Lead', cls: 'bg-stone-700 text-stone-200' },
  { value: 'demo', label: 'Demo', cls: 'bg-blue-900 text-blue-200' },
  { value: 'trial', label: 'Trial', cls: 'bg-amber-900 text-amber-200' },
  { value: 'active', label: 'Active', cls: 'bg-green-800 text-green-200' },
  { value: 'churned', label: 'Churned', cls: 'bg-red-900 text-red-200' },
  { value: 'lost', label: 'Lost', cls: 'bg-stone-800 text-stone-400 line-through' },
]

const ROLES = ['puheenjohtaja', 'sihteeri', 'rahastonhoitaja', 'muu']
const SOURCES = ['landing', 'referral', 'cold', 'event', 'other']
const ACTIVITY_ICONS: Record<string, string> = { email: '📧', call: '📞', note: '📝', demo: '🎯' }

const statusBadgeCls = (s: string) => STATUSES.find((st) => st.value === s)?.cls ?? 'bg-stone-700 text-stone-200'

export default function CrmTab() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [sub, setSub] = useState<'contacts' | 'activities' | 'pipeline'>('contacts')
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string | null>>({})
  const [actForm, setActForm] = useState<{ contactId: string; type: string; subject: string; body: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [cRes, aRes] = await Promise.all([
      fetch('/api/crm/contacts'),
      fetch('/api/crm/activities'),
    ])
    if (cRes.ok) setContacts(((await cRes.json()) as { contacts: Contact[] }).contacts)
    if (aRes.ok) setActivities(((await aRes.json()) as { activities: Activity[] }).activities)
  }, [])

  useEffect(() => { void load() }, [load])

  const openNew = () => {
    setEditId(null)
    setForm({ name: '', email: '', phone: '', role: '', club_name: '', status: 'lead', source: '', notes: '', next_action: '', next_action_date: '' })
    setFormOpen(true)
  }

  const openEdit = (c: Contact) => {
    setEditId(c.id)
    setForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', role: c.role ?? '', club_name: c.club_name ?? '', status: c.status, source: c.source ?? '', notes: c.notes ?? '', next_action: c.next_action ?? '', next_action_date: c.next_action_date ?? '' })
    setFormOpen(true)
  }

  const save = async () => {
    setBusy(true)
    const url = editId ? `/api/crm/contacts/${editId}` : '/api/crm/contacts'
    const method = editId ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setBusy(false)
    setFormOpen(false)
    void load()
  }

  const del = async (id: string) => {
    if (!confirm('Poistetaanko kontakti?')) return
    await fetch(`/api/crm/contacts/${id}`, { method: 'DELETE' })
    void load()
  }

  const changeStatus = async (id: string, status: string) => {
    await fetch(`/api/crm/contacts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  const saveActivity = async () => {
    if (!actForm) return
    setBusy(true)
    await fetch('/api/crm/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: actForm.contactId, type: actForm.type, subject: actForm.subject, body: actForm.body }),
    })
    setBusy(false)
    setActForm(null)
    void load()
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const selectCls = 'w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-xs text-green-400'

  const PIPELINE_COLS = ['lead', 'demo', 'trial', 'active', 'churned']

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl border border-green-800 bg-white/5 p-1">
        {(['contacts', 'activities', 'pipeline'] as const).map((s) => (
          <button key={s} onClick={() => setSub(s)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${sub === s ? 'bg-green-700 text-white' : 'text-green-400 hover:bg-white/10'}`}>
            {s === 'contacts' ? 'Kontaktit' : s === 'activities' ? 'Aktiviteetit' : 'Pipeline'}
          </button>
        ))}
        <button onClick={openNew} className="ml-auto flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-600">
          <Plus size={13} /> Lisää kontakti
        </button>
      </div>

      {/* Contacts */}
      {sub === 'contacts' && (
        <div className="rounded-2xl border border-green-800 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-green-800 bg-green-950">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Nimi</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Seura</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Seur. toimenpide</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Lisätty</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Toiminnot</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-white">{c.name}</p>
                      {c.role && <p className="text-xs text-green-500">{c.role}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-green-300 text-xs">{c.club_name ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center">
                      <select value={c.status} onChange={(e) => void changeStatus(c.id, e.target.value)} className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium outline-none cursor-pointer ${statusBadgeCls(c.status)}`}>
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      {c.next_action && <p className="text-xs text-white">{c.next_action}</p>}
                      {c.next_action_date && <p className="text-xs text-green-500">{formatDate(c.next_action_date)}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-green-500">{formatDate(c.created_at)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setActForm({ contactId: c.id, type: 'note', subject: '', body: '' })} className="rounded-md p-1 text-green-600 hover:text-green-300" title="Lisää aktiviteetti"><Plus size={13} /></button>
                        <button onClick={() => openEdit(c)} className="rounded-md p-1 text-green-600 hover:text-green-300"><Pencil size={13} /></button>
                        <button onClick={() => void del(c.id)} className="rounded-md p-1 text-red-500 hover:text-red-300"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {contacts.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-green-600">Ei kontakteja.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activities */}
      {sub === 'activities' && (
        <div className="space-y-2">
          {activities.length === 0 && <p className="py-6 text-center text-sm text-green-600">Ei aktiviteetteja.</p>}
          {activities.map((a) => {
            const contact = a.crm_contacts as { name: string; club_name: string | null } | null
            return (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-green-900/40 bg-white/[0.03] px-4 py-3">
                <span className="text-lg shrink-0">{ACTIVITY_ICONS[a.type] ?? '📝'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white">{contact?.name ?? '?'}{contact?.club_name ? ` — ${contact.club_name}` : ''}</p>
                  {a.subject && <p className="text-xs text-green-300">{a.subject}</p>}
                  {a.body && <p className="text-xs text-green-500 line-clamp-2">{a.body}</p>}
                </div>
                <span className="shrink-0 text-xs text-green-600">{formatDate(a.created_at)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Pipeline kanban */}
      {sub === 'pipeline' && (
        <div className="grid gap-3 sm:grid-cols-5">
          {PIPELINE_COLS.map((col) => {
            const items = contacts.filter((c) => c.status === col)
            const s = STATUSES.find((st) => st.value === col)
            return (
              <div key={col} className="rounded-2xl border border-green-800 bg-white/[0.03] p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-400">{s?.label ?? col} ({items.length})</h4>
                <div className="space-y-2">
                  {items.map((c) => (
                    <div key={c.id} className="rounded-lg border border-green-900/40 bg-white/5 p-2.5">
                      <p className="text-sm font-medium text-white">{c.name}</p>
                      {c.club_name && <p className="text-xs text-green-500">{c.club_name}</p>}
                      {c.next_action && <p className="mt-1 text-xs text-green-400">{c.next_action}</p>}
                      <p className="mt-1 text-[10px] text-green-700">
                        {Math.ceil((Date.now() - new Date(c.created_at).getTime()) / 86400000)} pv
                      </p>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-xs text-green-700 text-center py-4">—</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Contact form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setFormOpen(false)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-gradient-to-b from-green-950 to-stone-950 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editId ? 'Muokkaa kontaktia' : 'Uusi kontakti'}</h2>
              <button onClick={() => setFormOpen(false)} className="text-green-400 hover:bg-white/10 rounded-lg p-1.5"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><label className={labelCls}>Nimi *</label><input value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Sähköposti</label><input type="email" value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Puhelin</label><input type="tel" value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Rooli</label><select value={form.role ?? ''} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={selectCls}><option value="">—</option>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
              <div><label className={labelCls}>Seuran nimi</label><input value={form.club_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, club_name: e.target.value }))} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Status</label><select value={form.status ?? 'lead'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={selectCls}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                <div><label className={labelCls}>Lähde</label><select value={form.source ?? ''} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} className={selectCls}><option value="">—</option>{SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div><label className={labelCls}>Muistiinpanot</label><textarea value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className={inputCls} /></div>
              <div><label className={labelCls}>Seuraava toimenpide</label><input value={form.next_action ?? ''} onChange={(e) => setForm((f) => ({ ...f, next_action: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Päivämäärä</label><input type="date" value={form.next_action_date ?? ''} onChange={(e) => setForm((f) => ({ ...f, next_action_date: e.target.value }))} className={inputCls} /></div>
              <button onClick={() => void save()} disabled={busy || !form.name?.trim()} className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Tallennetaan...' : 'Tallenna'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Activity inline form */}
      {actForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={() => setActForm(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-green-700 bg-green-950 p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-bold text-white">Lisää aktiviteetti</h3><button onClick={() => setActForm(null)} className="text-green-500"><X size={16} /></button></div>
            <div><label className={labelCls}>Tyyppi</label><select value={actForm.type} onChange={(e) => setActForm((f) => f ? { ...f, type: e.target.value } : f)} className={selectCls}><option value="note">📝 Muistiinpano</option><option value="email">📧 Sähköposti</option><option value="call">📞 Puhelu</option><option value="demo">🎯 Demo</option></select></div>
            <div><label className={labelCls}>Aihe</label><input value={actForm.subject} onChange={(e) => setActForm((f) => f ? { ...f, subject: e.target.value } : f)} className={inputCls} /></div>
            <div><label className={labelCls}>Sisältö</label><textarea value={actForm.body} onChange={(e) => setActForm((f) => f ? { ...f, body: e.target.value } : f)} rows={3} className={inputCls} /></div>
            <button onClick={() => void saveActivity()} disabled={busy} className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Tallennetaan...' : 'Tallenna'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
