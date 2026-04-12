'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'

type ClubInfo = {
  name: string
  business_id: string
  street_address: string
  postal_address: string
  email: string
  phone: string
  mobile: string
}

const EMPTY: ClubInfo = {
  name: '',
  business_id: '',
  street_address: '',
  postal_address: '',
  email: '',
  phone: '',
  mobile: '',
}

interface Props {
  clubId: string
}

export default function TabClubInfo({ clubId }: Props) {
  const supabase = createClient()
  const [form, setForm] = useState<ClubInfo>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('clubs')
        .select('name, business_id, street_address, postal_address, email, phone, mobile')
        .eq('id', clubId)
        .single()

      if (data) {
        const d = data as Partial<ClubInfo>
        setForm({
          name: d.name ?? '',
          business_id: d.business_id ?? '',
          street_address: d.street_address ?? '',
          postal_address: d.postal_address ?? '',
          email: d.email ?? '',
          phone: d.phone ?? '',
          mobile: d.mobile ?? '',
        })
      }
      setLoading(false)
    }
    void load()
  }, [clubId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    setError('')
    setSaving(true)

    const res = await fetch('/api/club-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const json = (await res.json()) as { ok?: boolean; error?: string }
    if (!res.ok || !json.ok) {
      setError(json.error ?? 'Tallennus epäonnistui')
    } else {
      setSuccess('Tiedot tallennettu')
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  const set = (field: keyof ClubInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const inputClass =
    'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500'
  const labelClass = 'mb-1 block text-sm text-green-300'

  if (loading) return <p className="text-sm text-green-500">Ladataan...</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-green-800 bg-white/5 p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
          Seuran perustiedot
        </h2>

        <div>
          <label className={labelClass}>Seuran nimi</label>
          <input type="text" value={form.name} onChange={set('name')} className={inputClass} placeholder="Metsästysseura ry" />
        </div>

        <div>
          <label className={labelClass}>Y-tunnus</label>
          <input type="text" value={form.business_id} onChange={set('business_id')} className={inputClass} placeholder="1234567-8" />
        </div>
      </div>

      <div className="rounded-2xl border border-green-800 bg-white/5 p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
          Osoitetiedot
        </h2>

        <div>
          <label className={labelClass}>Katuosoite</label>
          <input type="text" value={form.street_address} onChange={set('street_address')} className={inputClass} placeholder="Metsätie 1" />
        </div>

        <div>
          <label className={labelClass}>Postiosoite</label>
          <input type="text" value={form.postal_address} onChange={set('postal_address')} className={inputClass} placeholder="00100 Helsinki" />
        </div>
      </div>

      <div className="rounded-2xl border border-green-800 bg-white/5 p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">
          Yhteystiedot
        </h2>

        <div>
          <label className={labelClass}>Sähköposti</label>
          <input type="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="seura@esimerkki.fi" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Puhelinnumero</label>
            <input type="tel" value={form.phone} onChange={set('phone')} className={inputClass} placeholder="+358 9 123 4567" />
          </div>
          <div>
            <label className={labelClass}>Matkapuhelin</label>
            <input type="tel" value={form.mobile} onChange={set('mobile')} className={inputClass} placeholder="+358 50 123 4567" />
          </div>
        </div>
      </div>

      {success && (
        <p className="rounded-lg bg-green-900/40 px-3 py-2 text-sm text-green-300">{success}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Tallennetaan...' : 'Tallenna tiedot'}
      </button>

      {/* Bank accounts section */}
      <BankAccountsSection clubId={clubId} />
    </form>
  )
}

// ─── Bank Accounts ─────────────────────────────────────────────

type BankAccount = { id: string; account_name: string; iban: string; bic: string | null; is_default: boolean }

function BankAccountsSection({ clubId }: { clubId: string }) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [af, setAf] = useState({ account_name: '', iban: '', bic: '', is_default: false })
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/club/bank-accounts')
    if (res.ok) {
      const d = (await res.json()) as { accounts: BankAccount[] }
      setAccounts(d.accounts)
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const openNew = () => { setEditId(null); setAf({ account_name: '', iban: '', bic: '', is_default: accounts.length === 0 }); setFormOpen(true) }
  const openEdit = (a: BankAccount) => { setEditId(a.id); setAf({ account_name: a.account_name, iban: a.iban, bic: a.bic ?? '', is_default: a.is_default }); setFormOpen(true) }

  const save = async () => {
    setBusy(true)
    const url = editId ? `/api/club/bank-accounts/${editId}` : '/api/club/bank-accounts'
    await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(af) })
    setBusy(false)
    setFormOpen(false)
    setToast(editId ? 'Tili päivitetty' : 'Tili lisätty')
    setTimeout(() => setToast(''), 3000)
    void load()
  }

  const del = async (id: string) => {
    if (!confirm('Poistetaanko tilinumero?')) return
    await fetch(`/api/club/bank-accounts/${id}`, { method: 'DELETE' })
    setToast('Tili poistettu')
    setTimeout(() => setToast(''), 3000)
    void load()
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-sm text-green-300'

  return (
    <div className="rounded-2xl border border-green-800 bg-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">Tilinumerot</h2>
        <button onClick={openNew} className="flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600">
          <Plus size={12} /> Lisää tilinumero
        </button>
      </div>

      {toast && <p className="rounded-lg bg-green-900/40 px-3 py-2 text-sm text-green-300">{toast}</p>}

      {loading ? <p className="text-sm text-green-500">Ladataan...</p> : accounts.length === 0 ? (
        <p className="text-sm text-green-600">Ei tilinumeroita. Lisää seuran tilinumero laskuja varten.</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-green-900/40 bg-white/[0.02] px-3 py-2 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{a.account_name}</span>
                  {a.is_default && <Star size={12} className="text-yellow-400" />}
                </div>
                <p className="text-xs text-green-400">{a.iban}{a.bic ? ` · ${a.bic}` : ''}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(a)} className="rounded-md p-1 text-green-600 hover:text-green-300"><Pencil size={12} /></button>
                <button onClick={() => void del(a.id)} className="rounded-md p-1 text-red-500 hover:text-red-300"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="rounded-xl border border-green-700 bg-green-900/20 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">{editId ? 'Muokkaa tiliä' : 'Lisää tilinumero'}</h3>
          <div><label className={labelCls}>Tilin nimi *</label><input type="text" value={af.account_name} onChange={(e) => setAf((f) => ({ ...f, account_name: e.target.value }))} className={inputCls} placeholder="esim. Päätiili" /></div>
          <div><label className={labelCls}>IBAN *</label><input type="text" value={af.iban} onChange={(e) => setAf((f) => ({ ...f, iban: e.target.value }))} className={inputCls} placeholder="FI12 3456 7890 1234 56" /></div>
          <div><label className={labelCls}>BIC</label><input type="text" value={af.bic} onChange={(e) => setAf((f) => ({ ...f, bic: e.target.value }))} className={inputCls} placeholder="NDEAFIHH" /></div>
          <label className="flex items-center gap-2 text-sm text-green-300">
            <input type="checkbox" checked={af.is_default} onChange={(e) => setAf((f) => ({ ...f, is_default: e.target.checked }))} className="h-4 w-4 rounded border-green-700 bg-green-950" />
            Aseta oletustiliksi
          </label>
          <div className="flex gap-2">
            <button onClick={() => void save()} disabled={busy || !af.account_name.trim() || !af.iban.trim()} className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Tallennetaan...' : 'Tallenna'}</button>
            <button onClick={() => setFormOpen(false)} className="rounded-lg border border-green-800 px-4 py-2 text-sm text-green-300">Peruuta</button>
          </div>
        </div>
      )}
    </div>
  )
}
