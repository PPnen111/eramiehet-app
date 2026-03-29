'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'

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
    </form>
  )
}
