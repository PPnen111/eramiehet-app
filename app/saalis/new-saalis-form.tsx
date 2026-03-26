'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { WifiOff, Clock } from 'lucide-react'

const QUEUE_KEY = 'pending_saalis_queue'

type PendingItem = {
  id: string
  club_id: string
  profile_id: string
  elain: string
  maara: number
  sukupuoli: string
  ika_luokka: string
  pvm: string
  paikka: string | null
  kuvaus: string | null
  reporter_name: string | null
  queued_at: string
}

function readQueue(): PendingItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as PendingItem[]
  } catch {
    return []
  }
}

function writeQueue(q: PendingItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
}

const ELAIMET = [
  { value: 'hirvi', label: 'Hirvi' },
  { value: 'valkohantapeura', label: 'Valkohäntäpeura' },
  { value: 'metsäkauris', label: 'Metsäkauris' },
  { value: 'karhu', label: 'Karhu' },
  { value: 'metsäjänis', label: 'Metsäjänis' },
  { value: 'fasaani', label: 'Fasaani' },
  { value: 'muu', label: 'Muu' },
]

interface Props {
  clubId: string
  profileId: string
}

export default function NewSaalisForm({ clubId, profileId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [elain, setElain] = useState('hirvi')
  const [maara, setMaara] = useState(1)
  const [sukupuoli, setSukupuoli] = useState('tuntematon')
  const [ikaLuokka, setIkaLuokka] = useState('tuntematon')
  const [pvm, setPvm] = useState(new Date().toISOString().slice(0, 10))
  const [paikka, setPaikka] = useState('')
  const [kuvaus, setKuvaus] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [error, setError] = useState('')
  const [pendingCount, setPendingCount] = useState(0)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle')

  // Sync pending queue when online
  useEffect(() => {
    setPendingCount(readQueue().length)

    async function syncQueue() {
      const queue = readQueue()
      if (queue.length === 0) return
      setSyncStatus('syncing')
      const remaining: PendingItem[] = []
      for (const item of queue) {
        const { id: _id, queued_at: _qa, ...insertData } = item
        const { error: e } = await supabase.from('saalis').insert(insertData)
        if (e) remaining.push(item)
      }
      writeQueue(remaining)
      setPendingCount(remaining.length)
      setSyncStatus(remaining.length === 0 ? 'done' : 'idle')
      if (remaining.length < queue.length) router.refresh()
    }

    window.addEventListener('online', syncQueue)
    if (navigator.onLine) syncQueue()
    return () => window.removeEventListener('online', syncQueue)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetForm() {
    setElain('hirvi')
    setMaara(1)
    setSukupuoli('tuntematon')
    setIkaLuokka('tuntematon')
    setPvm(new Date().toISOString().slice(0, 10))
    setPaikka('')
    setKuvaus('')
    setReporterName('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Offline: queue for later
    if (!navigator.onLine) {
      const item: PendingItem = {
        id: crypto.randomUUID(),
        club_id: clubId,
        profile_id: profileId,
        elain,
        maara,
        sukupuoli,
        ika_luokka: ikaLuokka,
        pvm,
        paikka: paikka || null,
        kuvaus: kuvaus || null,
        reporter_name: reporterName || null,
        queued_at: new Date().toISOString(),
      }
      const queue = readQueue()
      queue.push(item)
      writeQueue(queue)
      setPendingCount(queue.length)
      resetForm()
      setOpen(false)
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('saalis').insert({
      club_id: clubId,
      profile_id: profileId,
      reporter_name: reporterName || null,
      elain,
      maara,
      sukupuoli,
      ika_luokka: ikaLuokka,
      pvm,
      paikka: paikka || null,
      kuvaus: kuvaus || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    resetForm()
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  const handleClose = () => {
    setOpen(false)
    setError('')
  }

  const inputClass =
    'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const selectClass =
    'w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500'
  const labelClass = 'mb-1 block text-sm text-green-300'

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="relative shrink-0 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Ilmoita saalis
          {pendingCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-amber-900">
              {pendingCount}
            </span>
          )}
        </button>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-400">
            <WifiOff size={12} />
            {pendingCount} jonossa
          </span>
        )}
        {syncStatus === 'syncing' && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <Clock size={12} />
            Synkronoidaan...
          </span>
        )}
        {syncStatus === 'done' && (
          <span className="text-xs text-green-400">Synkronoitu ✓</span>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-6 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-green-800 bg-green-950 p-5 shadow-2xl">
            <h2 className="mb-4 font-semibold text-white">Uusi saalisilmoitus</h2>
            {!navigator?.onLine && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-900/30 border border-amber-700/50 px-3 py-2">
                <WifiOff size={14} className="mt-0.5 shrink-0 text-amber-400" />
                <p className="text-xs text-amber-300">
                  Ei verkkoyhteyttä. Ilmoitus tallennetaan paikallisesti ja lähetetään automaattisesti kun yhteys palaa.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Eläin *</label>
                  <select value={elain} onChange={(e) => setElain(e.target.value)} className={selectClass}>
                    {ELAIMET.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Määrä</label>
                  <input
                    type="number"
                    min={1}
                    value={maara}
                    onChange={(e) => setMaara(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Sukupuoli</label>
                  <select value={sukupuoli} onChange={(e) => setSukupuoli(e.target.value)} className={selectClass}>
                    <option value="tuntematon">–</option>
                    <option value="uros">Uros</option>
                    <option value="naaras">Naaras</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Ikäluokka</label>
                  <select value={ikaLuokka} onChange={(e) => setIkaLuokka(e.target.value)} className={selectClass}>
                    <option value="tuntematon">–</option>
                    <option value="vasa">Vasa</option>
                    <option value="nuori">Nuori</option>
                    <option value="aikuinen">Aikuinen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Päivämäärä *</label>
                <input
                  type="date"
                  value={pvm}
                  onChange={(e) => setPvm(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Ilmoittajan nimi</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Jätetä tyhjäksi käyttää profiilisi nimeä"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Paikka</label>
                <input
                  type="text"
                  value={paikka}
                  onChange={(e) => setPaikka(e.target.value)}
                  placeholder="esim. Peltometsä"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Lisätiedot</label>
                <textarea
                  value={kuvaus}
                  onChange={(e) => setKuvaus(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading ? 'Tallennetaan...' : 'Tallenna'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-green-800 px-4 py-2 text-sm text-green-300"
                >
                  Peruuta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

