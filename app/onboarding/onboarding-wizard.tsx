'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, BookOpen, CheckCircle, Plus, Trash2 } from 'lucide-react'

type OnboardingData = {
  step: number
  step1_completed: boolean
  step2_completed: boolean
  step3_completed: boolean
  members_imported: number | null
  completed_at: string | null
}

type ClubData = {
  name: string | null
  business_id: string | null
  street_address: string | null
  postal_address: string | null
  email: string | null
  phone: string | null
}

const STEPS = [
  { num: 1, title: 'Seuran tiedot', icon: Building2 },
  { num: 2, title: 'Tuo jäsenet', icon: Users },
  { num: 3, title: 'Ohjeet', icon: BookOpen },
]

const FEATURES = [
  { emoji: '👥', title: 'Jäsenet', desc: 'Hallitse seurasi jäsenistöä. Lisää jäseniä, lähetä kutsuja ja pidä rekisteri ajan tasalla.', where: 'Hallinto → Jäsenet' },
  { emoji: '💰', title: 'Maksut', desc: 'Lähetä jäsenmaksulaskuja ja seuraa maksujen tilannetta helposti.', where: 'Hallinto → Maksut' },
  { emoji: '📅', title: 'Tapahtumat', desc: 'Luo kokouksia, talkoita ja metsästyspäiviä. Jäsenet näkevät tapahtumat omalla sivullaan.', where: 'Tapahtumat → Uusi tapahtuma' },
  { emoji: '🦌', title: 'Saalis', desc: 'Kirjaa saalisilmoitukset helposti kentältä puhelimella. Tilastot kertyvät automaattisesti.', where: 'Saalis → Ilmoita saalis' },
  { emoji: '🏠', title: 'Eräkartano', desc: 'Jos seurallanne on eräkämppä tai mökki, voit ottaa varauskalenterin käyttöön.', where: 'Hallinto → Seuran tiedot' },
  { emoji: '📄', title: 'Dokumentit', desc: 'Jaa seuran asiakirjat, säännöt ja pöytäkirjat kaikkien jäsenten saataville.', where: 'Dokumentit' },
]

interface Props { clubName: string | null }

export default function OnboardingWizard({ clubName }: Props) {
  const router = useRouter()
  const [ob, setOb] = useState<OnboardingData | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // Step 1 form
  const [s1, setS1] = useState({ name: '', business_id: '', street_address: '', postal_code: '', postal_address: '', email: '', phone: '' })
  // Step 2 form
  const [manualMembers, setManualMembers] = useState([{ name: '', email: '' }])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/onboarding')
    if (res.ok) {
      const d = (await res.json()) as { onboarding: OnboardingData | null; club: ClubData | null; club_id: string }
      setOb(d.onboarding)
      if (d.onboarding) {
        setStep(Math.min(d.onboarding.step, 3))
        if (d.onboarding.completed_at) setDone(true)
      }
      if (d.club) {
        const pa = d.club.postal_address ?? ''
        const parts = pa.match(/^(\d{5})\s+(.+)$/)
        setS1({
          name: d.club.name ?? '',
          business_id: d.club.business_id ?? '',
          street_address: d.club.street_address ?? '',
          postal_code: parts ? parts[1] : '',
          postal_address: parts ? parts[2] : pa,
          email: d.club.email ?? '',
          phone: d.club.phone ?? '',
        })
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const patchOnboarding = async (update: Record<string, unknown>) => {
    await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
  }

  const inputCls = 'w-full rounded-lg border border-green-800 bg-white/10 px-4 py-3 text-sm text-white placeholder-green-600 outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-sm text-green-300'

  // ── Step handlers ──

  const submitStep1 = async () => {
    setBusy(true)
    const postalFull = [s1.postal_code, s1.postal_address].filter(Boolean).join(' ')
    await fetch('/api/club-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: s1.name,
        business_id: s1.business_id,
        street_address: s1.street_address,
        postal_address: postalFull,
        email: s1.email,
        phone: s1.phone,
      }),
    })
    await patchOnboarding({ step1_completed: true, step: 2 })
    setBusy(false)
    setStep(2)
  }

  const submitStep2Manual = async () => {
    setBusy(true)
    const validMembers = manualMembers.filter((m) => m.name.trim())
    for (const m of validMembers) {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: m.name.trim(), email: m.email.trim() || null, send_invite: false }),
      })
    }
    await patchOnboarding({ step2_completed: true, step: 3, members_imported: validMembers.length })
    setBusy(false)
    setStep(3)
  }

  const skipStep2 = async () => {
    await patchOnboarding({ step2_completed: true, step: 3, members_imported: 0 })
    setStep(3)
  }

  const completeOnboarding = async () => {
    setBusy(true)
    await patchOnboarding({ step3_completed: true })
    await fetch('/api/onboarding/complete', { method: 'POST' })
    setBusy(false)
    router.push('/dashboard')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 flex items-center justify-center">
        <p className="text-green-500">Ladataan...</p>
      </main>
    )
  }

  if (done) {
    router.push('/dashboard')
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <p className="text-center text-sm text-green-400 mb-3">Vaihe {step} / 3</p>
          <div className="flex justify-center gap-3">
            {STEPS.map((s) => {
              const Icon = s.icon
              const isDone = step > s.num
              const isCurrent = step === s.num
              return (
                <div key={s.num} className="flex flex-col items-center gap-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDone ? 'bg-green-600' : isCurrent ? 'bg-green-700 ring-2 ring-green-400' : 'bg-green-900/40'}`}>
                    <Icon size={18} className={isDone || isCurrent ? 'text-white' : 'text-green-700'} />
                  </div>
                  <span className={`text-[10px] ${isCurrent ? 'text-green-300' : 'text-green-700'}`}>{s.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── STEP 1: Seuran tiedot ── */}
        {step === 1 && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-6 space-y-4">
            <div className="text-center mb-4">
              <Building2 size={32} className="mx-auto text-green-400 mb-2" />
              <h2 className="text-xl font-bold text-white">Tervetuloa JahtiProhon!</h2>
              <p className="text-sm text-green-400 mt-1">Täytä seurasi perustiedot. Voit muokata näitä myöhemmin.</p>
            </div>
            <div><label className={labelCls}>Seuran nimi *</label><input type="text" value={s1.name} onChange={(e) => setS1((f) => ({ ...f, name: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Y-tunnus</label><input type="text" value={s1.business_id} onChange={(e) => setS1((f) => ({ ...f, business_id: e.target.value }))} className={inputCls} placeholder="1234567-8" /></div>
            <div><label className={labelCls}>Katuosoite</label><input type="text" value={s1.street_address} onChange={(e) => setS1((f) => ({ ...f, street_address: e.target.value }))} className={inputCls} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Postinumero</label><input type="text" value={s1.postal_code} onChange={(e) => setS1((f) => ({ ...f, postal_code: e.target.value.replace(/\D/g, '').slice(0, 5) }))} className={inputCls} placeholder="00100" maxLength={5} inputMode="numeric" /></div>
              <div className="col-span-2"><label className={labelCls}>Postitoimipaikka</label><input type="text" value={s1.postal_address} onChange={(e) => setS1((f) => ({ ...f, postal_address: e.target.value }))} className={inputCls} placeholder="Helsinki" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Sähköposti</label><input type="email" value={s1.email} onChange={(e) => setS1((f) => ({ ...f, email: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Puhelin</label><input type="tel" value={s1.phone} onChange={(e) => setS1((f) => ({ ...f, phone: e.target.value }))} className={inputCls} /></div>
            </div>
            <button onClick={() => void submitStep1()} disabled={busy || !s1.name.trim()} className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
              {busy ? 'Tallennetaan...' : 'Tallenna ja jatka →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Tuo jäsenet ── */}
        {step === 2 && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-6 space-y-4">
            <div className="text-center mb-4">
              <Users size={32} className="mx-auto text-green-400 mb-2" />
              <h2 className="text-xl font-bold text-white">Lisää seurasi jäsenet</h2>
              <p className="text-sm text-green-400 mt-1">Tuo jäsenet tai lisää käsin. Voit myös ohittaa ja palata myöhemmin.</p>
            </div>
            <div className="space-y-2">
              {manualMembers.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={m.name} onChange={(e) => { const arr = [...manualMembers]; arr[i] = { ...arr[i], name: e.target.value }; setManualMembers(arr) }} placeholder="Nimi" className={inputCls} />
                  <input type="email" value={m.email} onChange={(e) => { const arr = [...manualMembers]; arr[i] = { ...arr[i], email: e.target.value }; setManualMembers(arr) }} placeholder="Sähköposti (valinnainen)" className={inputCls} />
                  {manualMembers.length > 1 && (
                    <button onClick={() => setManualMembers((a) => a.filter((_, j) => j !== i))} className="shrink-0 text-red-500 hover:text-red-300"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
              <button onClick={() => setManualMembers((a) => [...a, { name: '', email: '' }])} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                <Plus size={12} /> Lisää rivi
              </button>
            </div>
            <button onClick={() => void submitStep2Manual()} disabled={busy || !manualMembers.some((m) => m.name.trim())} className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
              {busy ? 'Tallennetaan...' : 'Tallenna ja jatka →'}
            </button>
            <button onClick={() => void skipStep2()} className="w-full text-center text-xs text-green-600 hover:text-green-400">
              ⏭️ Ohita toistaiseksi — voit tuoda jäsenet myöhemmin hallintosivulta
            </button>
          </div>
        )}

        {/* ── STEP 3: Ohjeet ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-green-800 bg-white/5 p-6">
              <div className="text-center mb-6">
                <BookOpen size={32} className="mx-auto text-green-400 mb-2" />
                <h2 className="text-xl font-bold text-white">Seuranne on valmis — näin pääset alkuun</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {FEATURES.map((f, i) => (
                  <div key={i} className="rounded-xl border border-green-900/40 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{f.emoji}</span>
                      <h3 className="font-semibold text-white">{f.title}</h3>
                    </div>
                    <p className="text-xs text-green-300 leading-relaxed mb-2">{f.desc}</p>
                    <p className="text-[10px] text-green-600">Löydät tämän: {f.where}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-green-700/40 bg-green-900/20 px-4 py-3">
                <p className="text-sm text-green-300">
                  💡 <strong className="text-white">Vinkki:</strong> Aloita tuomalla jäsenlistasi Hallinto → Jäsenet → Tuo jäseniä (CSV/Excel)
                </p>
              </div>
            </div>

            <button onClick={() => void completeOnboarding()} disabled={busy} className="w-full rounded-xl bg-green-600 py-3.5 text-base font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
              {busy ? 'Viimeistellään...' : 'Siirry seuran etusivulle →'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
