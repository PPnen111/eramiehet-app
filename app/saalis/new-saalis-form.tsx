'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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

    setElain('hirvi')
    setMaara(1)
    setSukupuoli('tuntematon')
    setIkaLuokka('tuntematon')
    setPvm(new Date().toISOString().slice(0, 10))
    setPaikka('')
    setKuvaus('')
    setReporterName('')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white"
      >
        + Ilmoita saalis
      </button>
    )
  }

  const inputClass =
    'w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const selectClass =
    'w-full rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-sm text-white outline-none focus:border-green-500'
  const labelClass = 'mb-1 block text-sm text-green-300'

  return (
    <div className="animate-slide-down rounded-2xl border border-green-800 bg-white/5 p-5">
      <h2 className="mb-4 font-semibold text-white">Uusi saalisilmoitus</h2>
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
            onClick={() => setOpen(false)}
            className="rounded-lg border border-green-800 px-4 py-2 text-sm text-green-300"
          >
            Peruuta
          </button>
        </div>
      </form>
    </div>
  )
}
