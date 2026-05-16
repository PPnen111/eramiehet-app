'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

const MEMBER_OPTIONS = [
  { value: '', label: 'Valitse...' },
  { value: '30', label: 'Alle 30' },
  { value: '60', label: '30–60' },
  { value: '100', label: '60–100' },
  { value: '200', label: 'Yli 100' },
]

export default function UusiPage() {
  const [form, setForm] = useState({
    club_name: '', contact_name: '', contact_email: '', contact_phone: '',
    estimated_members: '', has_cabin: false, promo_code: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.club_name.trim() || !form.contact_name.trim() || !form.contact_email.trim()) {
      setError('Täytä pakolliset kentät.')
      return
    }
    setBusy(true)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        estimated_members: form.estimated_members ? Number(form.estimated_members) : null,
      }),
    })
    setBusy(false)
    if (res.ok) {
      setDone(true)
    } else {
      const d = (await res.json()) as { error?: string }
      setError(d.error ?? 'Jokin meni pieleen.')
    }
  }

  const inputCls = 'w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]'
  const selectCls = 'w-full rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-4 py-3 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]'
  const labelCls = 'mb-1 block text-sm font-medium text-[#1e3d1e]'

  if (done) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center space-y-6">
          <CheckCircle size={64} className="mx-auto text-[#2d6a2d]" />
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Tilisi on luotu!</h1>
          <p className="text-[#1e3d1e]">
            Olemme lähettäneet aktivointiviestin osoitteeseen{' '}
            <span className="font-semibold text-[#1a1a1a]">{form.contact_email}</span>.
            Tarkista sähköpostisi ja aseta salasanasi.
          </p>
          <a
            href="https://jahtipro.fi/login"
            className="inline-block rounded-xl bg-green-600 px-8 py-3.5 text-base font-bold text-white hover:bg-green-500 transition-colors"
          >
            Kirjaudu JahtiProhon →
          </a>
          <p className="text-xs text-[#888888]">
            Ensimmäinen kirjautuminen ohjaa sinut käyttöönotto-oppaaseen.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-12">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1a1a1a]">JahtiPro</h1>
          <p className="mt-2 text-lg text-[#1e3d1e]">Aloita ilmainen 14 päivän kokeilu</p>
          <p className="mt-1 text-sm text-[#4a4a4a]">Ei luottokorttia &bull; Ei sitoumuksia &bull; Valmis 5 minuutissa</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#e0d8cc] bg-white p-6">
          <div>
            <label className={labelCls}>Seuran nimi *</label>
            <input type="text" value={form.club_name} onChange={(e) => set('club_name', e.target.value)} placeholder="esim. Erämiesten Metsästysseura ry" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Yhteyshenkilön nimi *</label>
            <input type="text" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Etunimi Sukunimi" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Sähköposti *</label>
            <input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="seura@esimerkki.fi" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Puhelinnumero</label>
            <input type="tel" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="040 1234567" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Arvioitu jäsenmäärä</label>
            <select value={form.estimated_members} onChange={(e) => set('estimated_members', e.target.value)} className={selectCls}>
              {MEMBER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="cabin" checked={form.has_cabin} onChange={(e) => set('has_cabin', e.target.checked)} className="h-4 w-4 rounded border-[#e0d8cc] bg-[#f5f0e8] text-[#4a4a4a]" />
            <label htmlFor="cabin" className="text-sm text-[#1e3d1e]">Onko teillä tällä hetkellä varattavia tiloja tai eräkoteja/mökkejä?</label>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#888888]">Kampanjakoodi (valinnainen)</label>
            <input type="text" value={form.promo_code} onChange={(e) => set('promo_code', e.target.value)} placeholder="" className="w-full rounded-lg border border-[#e0d8cc] bg-white px-3 py-2 text-xs text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]" />
          </div>

          {error && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>}

          <button type="submit" disabled={busy} className="w-full rounded-xl bg-green-600 py-3.5 text-base font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
            {busy ? 'Lähetetään...' : 'Aloita kokeilu →'}
          </button>

          <p className="text-center text-xs text-[#2d6a2d]">
            Jättämällä tiedot hyväksyt{' '}
            <a href="/tietosuoja" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#4a4a4a]">tietosuojaselosteen</a>
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-[#888888]">
          Onko sinulla jo tili?{' '}
          <Link href="/login" className="text-[#2d6a2d] hover:text-[#1e3d1e]">Kirjaudu sisään</Link>
        </p>
      </div>
    </main>
  )
}
