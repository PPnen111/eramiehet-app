'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pencil, Send, X } from 'lucide-react'
import { formatDate } from '@/lib/format'

type Sequence = { id: string; name: string; trigger: string | null; subject: string | null; body: string | null; delay_hours: number | null; is_active: boolean }
type EmailSend = { id: string; to_email: string; subject: string | null; status: string; sent_at: string | null }
type Contact = { id: string; name: string; email: string | null }

const STATUS_CLS: Record<string, string> = {
  sent: 'bg-green-800 text-green-200',
  failed: 'bg-red-900 text-red-200',
  bounced: 'bg-amber-900 text-amber-200',
}

export default function EmailTab() {
  const [sub, setSub] = useState<'sequences' | 'history' | 'manual'>('sequences')
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [sends, setSends] = useState<EmailSend[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [editSeq, setEditSeq] = useState<Sequence | null>(null)
  const [manualForm, setManualForm] = useState({ to_email: '', subject: '', body: '', contact_id: '' })
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    const [sRes, cRes] = await Promise.all([
      fetch('/api/crm/sequences'),
      fetch('/api/crm/contacts'),
    ])
    if (sRes.ok) setSequences(((await sRes.json()) as { sequences: Sequence[] }).sequences)
    if (cRes.ok) {
      const all = ((await cRes.json()) as { contacts: Contact[] }).contacts
      setContacts(all)
    }
    // email_sends are fetched via a simple endpoint; if it doesn't exist, show empty
    try {
      const esRes = await fetch('/api/crm/sequences')
      if (esRes.ok) {
        // no dedicated sends endpoint yet; leave empty
      }
    } catch { /* */ }
  }, [])

  useEffect(() => { void load() }, [load])

  const toggleSequence = async (seq: Sequence) => {
    await fetch('/api/crm/sequences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: seq.id, is_active: !seq.is_active }),
    })
    setSequences((prev) => prev.map((s) => (s.id === seq.id ? { ...s, is_active: !s.is_active } : s)))
  }

  const saveSequence = async () => {
    if (!editSeq) return
    setBusy(true)
    await fetch('/api/crm/sequences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editSeq.id, subject: editSeq.subject, body: editSeq.body }),
    })
    setBusy(false)
    setEditSeq(null)
    void load()
  }

  const sendManual = async () => {
    if (!manualForm.to_email || !manualForm.subject || !manualForm.body) return
    setBusy(true)
    const res = await fetch('/api/crm/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manualForm),
    })
    setBusy(false)
    if (res.ok) {
      setToast('Sähköposti lähetetty!')
      setManualForm({ to_email: '', subject: '', body: '', contact_id: '' })
      setTimeout(() => setToast(''), 3000)
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      setToast(d.error ?? 'Lähetys epäonnistui')
      setTimeout(() => setToast(''), 4000)
    }
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-xs text-green-400'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl border border-green-800 bg-white/5 p-1">
        {(['sequences', 'history', 'manual'] as const).map((s) => (
          <button key={s} onClick={() => setSub(s)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${sub === s ? 'bg-green-700 text-white' : 'text-green-400 hover:bg-white/10'}`}>
            {s === 'sequences' ? 'Sekvenssit' : s === 'history' ? 'Lähetyshistoria' : 'Lähetä viesti'}
          </button>
        ))}
      </div>

      {toast && <div className="rounded-xl bg-green-800/60 px-4 py-3 text-sm font-medium text-green-200">{toast}</div>}

      {/* Sequences */}
      {sub === 'sequences' && (
        <div className="space-y-3">
          {sequences.length === 0 && <p className="py-6 text-center text-sm text-green-600">Ei sekvenssejä.</p>}
          {sequences.map((seq) => (
            <div key={seq.id} className="rounded-2xl border border-green-800 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{seq.name}</p>
                  <p className="text-xs text-green-500">Trigger: {seq.trigger ?? '—'} | Viive: {seq.delay_hours ?? 0}h</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void toggleSequence(seq)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${seq.is_active ? 'bg-green-700 text-green-100' : 'bg-stone-700 text-stone-300'}`}
                  >
                    {seq.is_active ? 'Aktiivinen' : 'Pois'}
                  </button>
                  <button onClick={() => setEditSeq({ ...seq })} className="rounded-md p-1 text-green-600 hover:text-green-300"><Pencil size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {sub === 'history' && (
        <div className="rounded-2xl border border-green-800 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-green-800 bg-green-950">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Vastaanottaja</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-green-400">Aihe</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Tila</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-green-400">Lähetetty</th>
                </tr>
              </thead>
              <tbody>
                {sends.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-green-600">Ei lähetyksiä.</td></tr>}
                {sends.map((s) => (
                  <tr key={s.id} className="border-b border-green-900/30">
                    <td className="px-3 py-2.5 text-white">{s.to_email}</td>
                    <td className="px-3 py-2.5 text-green-300 text-xs">{s.subject ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[s.status] ?? 'bg-stone-700 text-stone-200'}`}>{s.status}</span></td>
                    <td className="px-3 py-2.5 text-center text-xs text-green-500">{s.sent_at ? formatDate(s.sent_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual send */}
      {sub === 'manual' && (
        <div className="mx-auto max-w-lg rounded-2xl border border-green-800 bg-white/5 p-6 space-y-4">
          <div>
            <label className={labelCls}>Vastaanottaja</label>
            <select
              value={manualForm.contact_id}
              onChange={(e) => {
                const c = contacts.find((ct) => ct.id === e.target.value)
                setManualForm((f) => ({ ...f, contact_id: e.target.value, to_email: c?.email ?? f.to_email }))
              }}
              className={inputCls}
            >
              <option value="">Kirjoita sähköposti käsin...</option>
              {contacts.filter((c) => c.email).map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Sähköposti</label>
            <input type="email" value={manualForm.to_email} onChange={(e) => setManualForm((f) => ({ ...f, to_email: e.target.value }))} className={inputCls} placeholder="nimi@esimerkki.fi" />
          </div>
          <div>
            <label className={labelCls}>Aihe</label>
            <input value={manualForm.subject} onChange={(e) => setManualForm((f) => ({ ...f, subject: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Viesti</label>
            <textarea value={manualForm.body} onChange={(e) => setManualForm((f) => ({ ...f, body: e.target.value }))} rows={6} className={inputCls} />
          </div>
          <button
            onClick={() => void sendManual()}
            disabled={busy || !manualForm.to_email || !manualForm.subject || !manualForm.body}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Send size={14} />
            {busy ? 'Lähetetään...' : 'Lähetä'}
          </button>
        </div>
      )}

      {/* Edit sequence modal */}
      {editSeq && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={() => setEditSeq(null)}>
          <div className="w-full max-w-md rounded-2xl border border-green-700 bg-green-950 p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-bold text-white">Muokkaa sekvenssiä: {editSeq.name}</h3><button onClick={() => setEditSeq(null)} className="text-green-500"><X size={16} /></button></div>
            <div><label className={labelCls}>Aihe</label><input value={editSeq.subject ?? ''} onChange={(e) => setEditSeq((s) => s ? { ...s, subject: e.target.value } : s)} className={inputCls} /></div>
            <div><label className={labelCls}>Sisältö</label><textarea value={editSeq.body ?? ''} onChange={(e) => setEditSeq((s) => s ? { ...s, body: e.target.value } : s)} rows={8} className={inputCls} /></div>
            <button onClick={() => void saveSequence()} disabled={busy} className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Tallennetaan...' : 'Tallenna'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
