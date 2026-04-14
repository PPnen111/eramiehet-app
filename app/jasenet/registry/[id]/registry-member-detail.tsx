'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Info, Mail, Receipt, Trash2, X } from 'lucide-react'
import type { RegistryMember } from './page'

interface Props { member: RegistryMember }

export default function RegistryMemberDetail({ member }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<RegistryMember>(member)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  const set = (k: keyof RegistryMember, v: string | null) =>
    setForm((f) => ({ ...f, [k]: v || null }))

  const save = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    const res = await fetch(`/api/members/registry/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const d = (await res.json()) as { error?: string }
      setError(d.error ?? 'Tallennus epäonnistui')
    }
  }

  const remove = async () => {
    if (!confirm('Haluatko varmasti poistaa tämän jäsenen?')) return
    setDeleting(true)
    const res = await fetch(`/api/members/registry/${member.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) router.push('/hallinto')
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-xs text-green-400'

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/hallinto" className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300">
          <ArrowLeft size={14} /> Takaisin
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{form.full_name ?? '—'}</h1>
            <p className="mt-1 text-xs text-blue-400">📋 Ei sovellustunnusta</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setInvoiceOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-600">
              <Receipt size={13} /> Lähetä lasku
            </button>
          </div>
        </div>

        {!form.email && (
          <div className="rounded-xl border border-blue-800/50 bg-blue-900/20 px-4 py-3 text-sm text-blue-200">
            <Info size={14} className="inline mr-1" />
            Ei sähköpostia — lasku postitetaan
          </div>
        )}

        {/* Henkilötiedot */}
        <section className="rounded-2xl border border-green-800 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">Henkilötiedot</h2>
          <div><label className={labelCls}>Nimi *</label><input type="text" value={form.full_name ?? ''} onChange={(e) => set('full_name', e.target.value)} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Sähköposti</label><input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Puhelinnumero</label><input type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Jäsennumero</label><input type="text" value={form.member_number ?? ''} onChange={(e) => set('member_number', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Syntymäaika</label><input type="date" value={form.birth_date ?? ''} onChange={(e) => set('birth_date', e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Jäsenlaji</label><input type="text" value={form.member_type ?? ''} onChange={(e) => set('member_type', e.target.value)} className={inputCls} placeholder="esim. Varsinainen jäsen" /></div>
        </section>

        {/* Osoitetiedot */}
        <section className="rounded-2xl border border-green-800 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">Osoitetiedot</h2>
          <div><label className={labelCls}>Katuosoite</label><input type="text" value={form.street_address ?? ''} onChange={(e) => set('street_address', e.target.value)} className={inputCls} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Postinumero</label><input type="text" value={form.postal_code ?? ''} onChange={(e) => set('postal_code', e.target.value)} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Postitoimipaikka</label><input type="text" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Kotikunta</label><input type="text" value={form.home_municipality ?? ''} onChange={(e) => set('home_municipality', e.target.value)} className={inputCls} /></div>
        </section>

        {/* Laskutus */}
        <section className="rounded-2xl border border-green-800 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">Laskutus</h2>
          <div>
            <label className={labelCls}>Laskutustapa</label>
            <input type="text" value={form.billing_method ?? ''} onChange={(e) => set('billing_method', e.target.value)} className={inputCls} placeholder="esim. kirje, sähköposti, verkkolasku" />
            <p className="mt-1 text-[10px] text-green-600">Huom: &ldquo;kirje&rdquo; = paperilasku postitse</p>
          </div>
          <div><label className={labelCls}>Lisätiedot</label><textarea value={form.additional_info ?? ''} onChange={(e) => set('additional_info', e.target.value)} rows={3} className={inputCls} /></div>
        </section>

        {error && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>}
        {saved && <p className="rounded-lg bg-green-900/40 px-3 py-2 text-sm text-green-300">Tallennettu ✓</p>}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => void save()} disabled={saving || !form.full_name?.trim()} className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
            {saving ? 'Tallennetaan...' : 'Tallenna muutokset'}
          </button>
          <button onClick={() => void remove()} disabled={deleting} className="rounded-xl border border-red-800 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-900/20 disabled:opacity-50 transition-colors">
            <Trash2 size={14} className="inline mr-1" /> Poista
          </button>
        </div>
      </div>

      {/* Invoice modal */}
      {invoiceOpen && (
        <InvoiceModal member={form} onClose={() => setInvoiceOpen(false)} />
      )}
    </main>
  )
}

function InvoiceModal({ member, onClose }: { member: RegistryMember; onClose: () => void }) {
  const [description, setDescription] = useState('Jäsenmaksu 2026')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))
  const [email, setEmail] = useState(member.email ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const send = async () => {
    setBusy(true)
    setError('')
    const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100)
    if (isNaN(cents) || cents <= 0) { setError('Tarkista summa'); setBusy(false); return }

    // First create the payment row if we have a profile_id, else use a registry-linked variant
    if (!member.profile_id) {
      setError('Jäsenellä ei ole sovellustunnusta — lasku tulee toistaiseksi lähettää manuaalisesti.')
      setBusy(false)
      return
    }

    // Create payment + send PDF invoice
    const payRes = await fetch('/api/members/' + member.profile_id + '/invoice-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount_cents: cents, due_date: dueDate }),
    }).catch(() => null)

    if (!payRes || !payRes.ok) {
      setError('Laskun luonti epäonnistui')
      setBusy(false)
      return
    }
    setBusy(false)
    setDone(true)
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-xs text-green-400'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-green-700 bg-green-950 p-6 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">Lähetä lasku</h2>
          <button onClick={onClose} className="text-green-500"><X size={16} /></button>
        </div>
        {done ? (
          <div className="space-y-3">
            <p className="text-sm text-green-300">✅ Lasku luotu</p>
            <button onClick={onClose} className="w-full rounded-lg bg-green-700 py-2 text-sm font-semibold text-white">Sulje</button>
          </div>
        ) : (
          <>
            {!member.email && (
              <p className="rounded-lg bg-blue-900/30 px-3 py-2 text-xs text-blue-200">
                Ei sähköpostia — postitse lähetettävä lasku
              </p>
            )}
            <div><label className={labelCls}>Kuvaus</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Summa (€)</label><input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="80,00" /></div>
            <div><label className={labelCls}>Eräpäivä</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} /></div>
            {member.email && (
              <div><label className={labelCls}>Sähköposti</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></div>
            )}
            {error && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-xs text-red-300">{error}</p>}
            <button onClick={() => void send()} disabled={busy} className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? 'Lähetetään...' : member.email ? 'Lähetä sähköpostilla' : 'Luo postitettava lasku'}
            </button>
          </>
        )}
      </div>
    </>
  )
}
