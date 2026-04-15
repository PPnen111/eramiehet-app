'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import PlanLimitModal from '@/app/components/plan-limit-modal'

type Location = {
  id: string; name: string; location_type: string; description: string | null
  pricing_text: string | null; instructions_text: string | null; max_capacity: number | null
  booking_unit: string; min_booking_hours: number | null; is_active: boolean; approver_count: number
}
type Approver = { id: string; name: string; email: string; phone: string | null; is_primary: boolean }
type Toast = { msg: string; type: 'ok' | 'err' }

const TYPES = [
  { value: 'erakartano', label: 'Eräkartano', cls: 'bg-green-800 text-green-200' },
  { value: 'takkatupa', label: 'Takkatupa', cls: 'bg-blue-900 text-blue-200' },
  { value: 'sauna', label: 'Sauna', cls: 'bg-orange-900 text-orange-200' },
  { value: 'ampumarata', label: 'Ampumarata', cls: 'bg-red-900 text-red-200' },
  { value: 'nylkyvaja', label: 'Nylkyvaja', cls: 'bg-stone-700 text-stone-200' },
  { value: 'majoitustilat', label: 'Majoitustilat', cls: 'bg-purple-900 text-purple-200' },
  { value: 'muu', label: 'Muu', cls: 'bg-stone-700 text-stone-200' },
]

const typeBadge = (t: string) => TYPES.find((x) => x.value === t) ?? TYPES[6]

interface Props { clubId: string }

export default function TabRentalLocations({ clubId }: Props) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<Toast | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [limitModal, setLimitModal] = useState<{ message: string; planLabel: string } | null>(null)

  // Form state
  const [f, setF] = useState({ name: '', location_type: 'erakartano', description: '', pricing_text: '', instructions_text: '', max_capacity: '', booking_unit: 'day', min_booking_hours: '1', is_active: true })
  const [approvers, setApprovers] = useState<{ name: string; email: string; phone: string; is_primary: boolean }[]>([{ name: '', email: '', phone: '', is_primary: true }])

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/rental-locations')
    if (res.ok) {
      const d = (await res.json()) as { locations: Location[] }
      setLocations(d.locations)
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const openNew = () => {
    setEditId(null)
    setF({ name: '', location_type: 'erakartano', description: '', pricing_text: '', instructions_text: '', max_capacity: '', booking_unit: 'day', min_booking_hours: '1', is_active: true })
    setApprovers([{ name: '', email: '', phone: '', is_primary: true }])
    setFormOpen(true)
  }

  const openEdit = async (loc: Location) => {
    setEditId(loc.id)
    setF({ name: loc.name, location_type: loc.location_type, description: loc.description ?? '', pricing_text: loc.pricing_text ?? '', instructions_text: loc.instructions_text ?? '', max_capacity: loc.max_capacity?.toString() ?? '', booking_unit: loc.booking_unit, min_booking_hours: loc.min_booking_hours?.toString() ?? '1', is_active: loc.is_active })
    const res = await fetch(`/api/rental-locations/${loc.id}`)
    if (res.ok) {
      const d = (await res.json()) as { approvers: Approver[] }
      setApprovers(d.approvers.length > 0 ? d.approvers.map((a) => ({ name: a.name, email: a.email, phone: a.phone ?? '', is_primary: a.is_primary })) : [{ name: '', email: '', phone: '', is_primary: true }])
    }
    setFormOpen(true)
  }

  const save = async () => {
    setBusy(true)
    const payload = { ...f, max_capacity: f.max_capacity ? Number(f.max_capacity) : null, min_booking_hours: f.min_booking_hours ? Number(f.min_booking_hours) : null }

    let locId = editId
    if (editId) {
      await fetch(`/api/rental-locations/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      const res = await fetch('/api/rental-locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.status === 403) {
        const d = (await res.json()) as { limit_exceeded?: boolean; error?: string; plan_label?: string }
        if (d.limit_exceeded) { setLimitModal({ message: d.error ?? '', planLabel: d.plan_label ?? '' }); setBusy(false); return }
      }
      if (res.ok) { const d = (await res.json()) as { id: string }; locId = d.id }
    }

    // Save approvers (delete old, insert new)
    if (locId) {
      if (editId) {
        const old = await fetch(`/api/rental-locations/${locId}`)
        if (old.ok) {
          const d = (await old.json()) as { approvers: Approver[] }
          for (const a of d.approvers) {
            await fetch(`/api/rental-locations/${locId}/approvers`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approver_id: a.id }) })
          }
        }
      }
      for (const a of approvers.filter((a) => a.name.trim() && a.email.trim())) {
        await fetch(`/api/rental-locations/${locId}/approvers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) })
      }
    }

    setBusy(false)
    setFormOpen(false)
    showToast(editId ? 'Kohde päivitetty' : 'Kohde lisätty')
    void load()
  }

  const deleteLocation = async (id: string) => {
    if (!confirm('Haluatko varmasti poistaa tämän kohteen?')) return
    await fetch(`/api/rental-locations/${id}`, { method: 'DELETE' })
    showToast('Kohde poistettu')
    void load()
  }

  const toggleActive = async (loc: Location) => {
    await fetch(`/api/rental-locations/${loc.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !loc.is_active }) })
    void load()
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const selectCls = 'w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-xs text-green-400'

  if (loading) return <p className="text-sm text-green-500">Ladataan...</p>

  return (
    <div className="space-y-4">
      {toast && <div className={`rounded-xl px-4 py-3 text-sm font-medium ${toast.type === 'ok' ? 'bg-green-800/60 text-green-200' : 'bg-red-900/60 text-red-200'}`}>{toast.msg}</div>}

      <button onClick={openNew} className="flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors">
        <Plus size={15} /> Lisää kohde
      </button>

      {locations.length === 0 ? (
        <p className="text-sm text-green-600">Ei vuokrattavia kohteita.</p>
      ) : (
        <div className="rounded-2xl border border-green-800 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead><tr className="border-b border-green-800 bg-green-950">
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Nimi</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Tyyppi</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Hyväksyjät</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Tila</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Toiminnot</th>
              </tr></thead>
              <tbody>
                {locations.map((loc) => {
                  const tb = typeBadge(loc.location_type)
                  return (
                    <tr key={loc.id} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                      <td className="px-3 py-2.5 font-medium text-white">{loc.name}</td>
                      <td className="px-3 py-2.5 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tb.cls}`}>{tb.label}</span></td>
                      <td className="px-3 py-2.5 text-center text-green-300">{loc.approver_count}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => void toggleActive(loc)} className={`rounded-full px-2 py-0.5 text-xs font-medium ${loc.is_active ? 'bg-green-800 text-green-200' : 'bg-stone-700 text-stone-300'}`}>
                          {loc.is_active ? 'Aktiivinen' : 'Piilotettu'}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => void openEdit(loc)} className="rounded-md p-1 text-green-600 hover:text-green-300"><Pencil size={13} /></button>
                          <button onClick={() => void deleteLocation(loc.id)} className="rounded-md p-1 text-red-500 hover:text-red-300"><Trash2 size={13} /></button>
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

      {/* Slide-in form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setFormOpen(false)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-gradient-to-b from-green-950 to-stone-950 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editId ? 'Muokkaa kohdetta' : 'Lisää kohde'}</h2>
              <button onClick={() => setFormOpen(false)} className="rounded-lg p-1.5 text-green-400 hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-green-400">Perustiedot</h3>
              <div><label className={labelCls}>Kohteen nimi *</label><input type="text" value={f.name} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Kohteen tyyppi *</label><select value={f.location_type} onChange={(e) => setF((v) => ({ ...v, location_type: e.target.value }))} className={selectCls}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>

              {f.location_type === 'ampumarata' && (
                <div className="rounded-lg border border-green-800 bg-white/[0.03] p-3 space-y-2">
                  <p className="text-xs text-green-300 font-medium">Miten ampumarata varataan?</p>
                  <label className="flex items-center gap-2 text-sm text-green-200"><input type="radio" checked={f.booking_unit === 'day'} onChange={() => setF((v) => ({ ...v, booking_unit: 'day' }))} /> Päivävaraus</label>
                  <label className="flex items-center gap-2 text-sm text-green-200"><input type="radio" checked={f.booking_unit === 'hour'} onChange={() => setF((v) => ({ ...v, booking_unit: 'hour' }))} /> Tuntivaraus</label>
                  {f.booking_unit === 'hour' && (
                    <div><label className={labelCls}>Minimikesto (tuntia)</label><input type="number" value={f.min_booking_hours} onChange={(e) => setF((v) => ({ ...v, min_booking_hours: e.target.value }))} className={inputCls} min={1} /></div>
                  )}
                </div>
              )}

              <div><label className={labelCls}>Kuvaus</label><textarea value={f.description} onChange={(e) => setF((v) => ({ ...v, description: e.target.value }))} rows={2} className={inputCls} /></div>
              <div><label className={labelCls}>Hinnasto</label><textarea value={f.pricing_text} onChange={(e) => setF((v) => ({ ...v, pricing_text: e.target.value }))} rows={2} className={inputCls} placeholder="Jäsenet 50€/vkl, vieraat 80€/vkl" /></div>
              <div><label className={labelCls}>Varausohjeet</label><textarea value={f.instructions_text} onChange={(e) => setF((v) => ({ ...v, instructions_text: e.target.value }))} rows={2} className={inputCls} /></div>
              <div><label className={labelCls}>Maksimikävijämäärä</label><input type="number" value={f.max_capacity} onChange={(e) => setF((v) => ({ ...v, max_capacity: e.target.value }))} className={inputCls} placeholder="Jätä tyhjäksi jos ei rajoitusta" /></div>

              <h3 className="text-sm font-semibold text-green-400 pt-2">Varausten hyväksyjät</h3>
              <p className="text-xs text-green-600">Saavat ilmoituksen uusista varauksista ja voivat lähettää laskun varaajalle.</p>
              <div className="space-y-2">
                {approvers.map((a, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <input type="text" value={a.name} onChange={(e) => { const arr = [...approvers]; arr[i] = { ...arr[i], name: e.target.value }; setApprovers(arr) }} placeholder="Nimi *" className={inputCls} />
                      <input type="email" value={a.email} onChange={(e) => { const arr = [...approvers]; arr[i] = { ...arr[i], email: e.target.value }; setApprovers(arr) }} placeholder="Sähköposti *" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1 items-center shrink-0">
                      <button onClick={() => { const arr = [...approvers]; arr.forEach((x, j) => { x.is_primary = j === i }); setApprovers(arr) }} className={`text-xs px-1.5 py-0.5 rounded ${a.is_primary ? 'text-yellow-300' : 'text-green-700'}`} title="Ensisijainen">☆</button>
                      {approvers.length > 1 && <button onClick={() => setApprovers((arr) => arr.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-300"><Trash2 size={12} /></button>}
                    </div>
                  </div>
                ))}
                <button onClick={() => setApprovers((a) => [...a, { name: '', email: '', phone: '', is_primary: false }])} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"><Plus size={12} /> Lisää hyväksyjä</button>
              </div>

              <button onClick={() => void save()} disabled={busy || !f.name.trim()} className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
                {busy ? 'Tallennetaan...' : 'Tallenna kohde'}
              </button>
            </div>
          </div>
        </div>
      )}

      {limitModal && <PlanLimitModal message={limitModal.message} planLabel={limitModal.planLabel} onClose={() => setLimitModal(null)} />}
    </div>
  )
}
