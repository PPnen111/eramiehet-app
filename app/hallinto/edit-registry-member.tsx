'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Registry = {
  id: string; full_name: string | null; email: string | null; phone: string | null
  member_number: string | null; birth_date: string | null; member_type: string | null
  street_address: string | null; postal_code: string | null; city: string | null
  home_municipality: string | null; billing_method: string | null; additional_info: string | null
}

interface Props {
  memberId: string
  onClose: () => void
  onSaved: () => void
}

export default function EditRegistryMember({ memberId, onClose, onSaved }: Props) {
  const [data, setData] = useState<Registry | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/members/registry/${memberId}`)
      if (res.ok) {
        const d = (await res.json()) as { member: Registry }
        setData(d.member)
      }
      setLoading(false)
    })()
  }, [memberId])

  const save = async () => {
    if (!data) return
    setBusy(true)
    setError('')
    const res = await fetch(`/api/members/registry/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone || null,
        member_number: data.member_number || null,
        birth_date: data.birth_date || null,
        member_type: data.member_type || null,
        street_address: data.street_address || null,
        postal_code: data.postal_code || null,
        city: data.city || null,
        home_municipality: data.home_municipality || null,
        billing_method: data.billing_method || null,
        additional_info: data.additional_info || null,
      }),
    })
    setBusy(false)
    if (res.ok) {
      onSaved()
      onClose()
    } else {
      const d = (await res.json()) as { error?: string }
      setError(d.error ?? 'Tallennus epäonnistui')
    }
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-xs text-green-400'

  const update = (k: keyof Registry, v: string) => setData((d) => d ? { ...d, [k]: v || null } : d)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-gradient-to-b from-green-950 to-stone-950 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Muokkaa jäsentä</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-green-400 hover:bg-white/10"><X size={18} /></button>
        </div>
        {loading ? <p className="text-sm text-green-500">Ladataan...</p> : !data ? <p className="text-sm text-red-400">Jäsentä ei löydy</p> : (
          <div className="space-y-3">
            <div><label className={labelCls}>Nimi *</label><input type="text" value={data.full_name ?? ''} onChange={(e) => update('full_name', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Jäsennumero</label><input type="text" value={data.member_number ?? ''} onChange={(e) => update('member_number', e.target.value)} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Sähköposti</label><input type="email" value={data.email ?? ''} onChange={(e) => update('email', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Puhelin</label><input type="tel" value={data.phone ?? ''} onChange={(e) => update('phone', e.target.value)} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Syntymäaika</label><input type="date" value={data.birth_date ?? ''} onChange={(e) => update('birth_date', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Jäsenlaji</label><input type="text" value={data.member_type ?? ''} onChange={(e) => update('member_type', e.target.value)} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Katuosoite</label><input type="text" value={data.street_address ?? ''} onChange={(e) => update('street_address', e.target.value)} className={inputCls} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Postinumero</label><input type="text" value={data.postal_code ?? ''} onChange={(e) => update('postal_code', e.target.value)} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Postitoimipaikka</label><input type="text" value={data.city ?? ''} onChange={(e) => update('city', e.target.value)} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Kotikunta</label><input type="text" value={data.home_municipality ?? ''} onChange={(e) => update('home_municipality', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Laskutustapa</label><input type="text" value={data.billing_method ?? ''} onChange={(e) => update('billing_method', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Lisätiedot</label><textarea value={data.additional_info ?? ''} onChange={(e) => update('additional_info', e.target.value)} rows={3} className={inputCls} /></div>
            {error && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>}
            <button onClick={() => void save()} disabled={busy || !data.full_name?.trim()} className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50">
              {busy ? 'Tallennetaan...' : 'Tallenna'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
