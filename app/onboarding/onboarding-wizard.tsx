'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, Calendar, Home, CheckCircle, Plus, Trash2 } from 'lucide-react'

type OnboardingData = {
  step: number
  step1_completed: boolean
  step2_completed: boolean
  step3_completed: boolean
  step4_completed: boolean
  has_cabin: boolean
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
  { num: 3, title: 'Tapahtuma', icon: Calendar },
  { num: 4, title: 'Eräkartano', icon: Home },
]

const EVENT_TYPES = [
  { value: 'kokous', label: 'Kokous' },
  { value: 'talkoot', label: 'Talkoot' },
  { value: 'ampumaharjoitus', label: 'Ampumaharjoitus' },
  { value: 'metsästyspäivä', label: 'Metsästyspäivä' },
  { value: 'kilpailu', label: 'Kilpailu' },
  { value: 'muu', label: 'Muu' },
]

interface Props { clubName: string | null }

export default function OnboardingWizard({ clubName }: Props) {
  const router = useRouter()
  const [ob, setOb] = useState<OnboardingData | null>(null)
  const [club, setClub] = useState<ClubData | null>(null)
  const [clubId, setClubId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // Step 1 form
  const [s1, setS1] = useState({ name: '', business_id: '', street_address: '', postal_address: '', email: '', phone: '' })
  // Step 2 form
  const [manualMembers, setManualMembers] = useState([{ name: '', email: '' }])
  // Step 3 form
  const [s3, setS3] = useState({ title: '', type: 'kokous', starts_at: '', description: '' })
  // Step 4 form
  const [hasCabin, setHasCabin] = useState<boolean | null>(null)
  const [s4, setS4] = useState({ pricing_text: '', instructions_text: '', approver_name: '', approver_email: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/onboarding')
    if (res.ok) {
      const d = (await res.json()) as { onboarding: OnboardingData | null; club: ClubData | null; club_id: string }
      setOb(d.onboarding)
      setClub(d.club)
      setClubId(d.club_id)
      if (d.onboarding) {
        setStep(d.onboarding.step)
        setHasCabin(d.onboarding.has_cabin)
        if (d.onboarding.completed_at) setDone(true)
      }
      if (d.club) {
        setS1({
          name: d.club.name ?? '', business_id: d.club.business_id ?? '',
          street_address: d.club.street_address ?? '', postal_address: d.club.postal_address ?? '',
          email: d.club.email ?? '', phone: d.club.phone ?? '',
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
  const selectCls = 'w-full rounded-lg border border-green-800 bg-green-950 px-4 py-3 text-sm text-white outline-none focus:border-green-500'
  const labelCls = 'mb-1 block text-sm text-green-300'

  // ── Step handlers ──

  const submitStep1 = async () => {
    setBusy(true)
    await fetch('/api/club-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s1),
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

  const submitStep3 = async () => {
    setBusy(true)
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: s3.title, type: s3.type, starts_at: s3.starts_at || null, description: s3.description || null }),
    }).catch(() => {})
    await patchOnboarding({ step3_completed: true, step: 4 })
    setBusy(false)
    setStep(4)
  }

  const skipStep3 = async () => {
    await patchOnboarding({ step3_completed: true, step: 4 })
    setStep(4)
  }

  const submitStep4 = async () => {
    setBusy(true)
    if (hasCabin && clubId) {
      await fetch('/api/club-info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabin_pricing: s4.pricing_text, cabin_instructions: s4.instructions_text, approver_name: s4.approver_name, approver_email: s4.approver_email }),
      }).catch(() => {})
    }
    await patchOnboarding({ step4_completed: true, has_cabin: hasCabin === true })
    await fetch('/api/onboarding/complete', { method: 'POST' })
    setBusy(false)
    setDone(true)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 flex items-center justify-center">
        <p className="text-green-500">Ladataan...</p>
      </main>
    )
  }

  // ── Completion screen ──
  if (done) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 flex items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center space-y-6">
          <CheckCircle size={72} className="mx-auto text-green-400" />
          <h1 className="text-2xl font-bold text-white">{clubName ?? 'Seura'} on valmis!</h1>
          <div className="space-y-2 text-left rounded-xl border border-green-800 bg-white/5 p-4">
            <p className="flex items-center gap-2 text-sm text-green-300"><CheckCircle size={14} className="text-green-400" /> Seuran tiedot tallennettu</p>
            <p className="flex items-center gap-2 text-sm text-green-300">{ob?.members_imported ? <CheckCircle size={14} className="text-green-400" /> : <span className="text-xs">⏭️</span>} {ob?.members_imported ? `${ob.members_imported} jäsentä tuotu` : 'Jäsenet ohitettu'}</p>
            <p className="flex items-center gap-2 text-sm text-green-300">{ob?.step3_completed ? <CheckCircle size={14} className="text-green-400" /> : <span className="text-xs">⏭️</span>} {ob?.step3_completed ? 'Tapahtuma luotu' : 'Tapahtuma ohitettu'}</p>
            <p className="flex items-center gap-2 text-sm text-green-300">{ob?.has_cabin ? <CheckCircle size={14} className="text-green-400" /> : <span className="text-xs">—</span>} {ob?.has_cabin ? 'Eräkartano asetettu' : 'Ei eräkartanoa'}</p>
          </div>
          <button onClick={() => { router.push('/dashboard'); router.refresh() }} className="w-full rounded-xl bg-green-600 py-3.5 text-base font-bold text-white hover:bg-green-500 transition-colors">
            Siirry dashboardiin →
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <p className="text-center text-sm text-green-400 mb-3">Vaihe {step} / 4</p>
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

        {/* ── STEP 1 ── */}
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
            <div><label className={labelCls}>Postitoimipaikka</label><input type="text" value={s1.postal_address} onChange={(e) => setS1((f) => ({ ...f, postal_address: e.target.value }))} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Sähköposti</label><input type="email" value={s1.email} onChange={(e) => setS1((f) => ({ ...f, email: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Puhelin</label><input type="tel" value={s1.phone} onChange={(e) => setS1((f) => ({ ...f, phone: e.target.value }))} className={inputCls} /></div>
            </div>
            <button onClick={() => void submitStep1()} disabled={busy || !s1.name.trim()} className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
              {busy ? 'Tallennetaan...' : 'Tallenna ja jatka →'}
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-6 space-y-4">
            <div className="text-center mb-4">
              <Users size={32} className="mx-auto text-green-400 mb-2" />
              <h2 className="text-xl font-bold text-white">Lisää seurasi jäsenet</h2>
              <p className="text-sm text-green-400 mt-1">Tuo jäsenet tai lisää käsin. Voit myös ohittaa ja palata myöhemmin.</p>
            </div>
            {/* Manual add */}
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

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-6 space-y-4">
            <div className="text-center mb-4">
              <Calendar size={32} className="mx-auto text-green-400 mb-2" />
              <h2 className="text-xl font-bold text-white">Luodaan ensimmäinen tapahtuma</h2>
              <p className="text-sm text-green-400 mt-1">Lisää ensimmäinen kokous, talkoot tai metsästyspäivä.</p>
            </div>
            <div><label className={labelCls}>Tapahtuman nimi *</label><input type="text" value={s3.title} onChange={(e) => setS3((f) => ({ ...f, title: e.target.value }))} placeholder="esim. Syyskokoous 2026" className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Tyyppi</label><select value={s3.type} onChange={(e) => setS3((f) => ({ ...f, type: e.target.value }))} className={selectCls}>{EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><label className={labelCls}>Päivämäärä *</label><input type="date" value={s3.starts_at} onChange={(e) => setS3((f) => ({ ...f, starts_at: e.target.value }))} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Kuvaus</label><textarea value={s3.description} onChange={(e) => setS3((f) => ({ ...f, description: e.target.value }))} rows={3} className={inputCls} placeholder="Valinnainen kuvaus..." /></div>
            <button onClick={() => void submitStep3()} disabled={busy || !s3.title.trim()} className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
              {busy ? 'Luodaan...' : 'Luo tapahtuma →'}
            </button>
            <button onClick={() => void skipStep3()} className="w-full text-center text-xs text-green-600 hover:text-green-400">
              ⏭️ Ohita toistaiseksi
            </button>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div className="rounded-2xl border border-green-800 bg-white/5 p-6 space-y-4">
            <div className="text-center mb-4">
              <Home size={32} className="mx-auto text-green-400 mb-2" />
              <h2 className="text-xl font-bold text-white">Onko seurallanne eräkartano?</h2>
            </div>
            {hasCabin === null && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setHasCabin(true)} className="rounded-xl border-2 border-green-700 bg-green-900/20 p-6 text-center hover:bg-green-900/40 transition-colors">
                  <p className="text-2xl mb-1">✅</p>
                  <p className="text-sm font-semibold text-white">Kyllä, meillä on</p>
                </button>
                <button onClick={() => setHasCabin(false)} className="rounded-xl border-2 border-green-900 bg-white/5 p-6 text-center hover:bg-white/10 transition-colors">
                  <p className="text-2xl mb-1">❌</p>
                  <p className="text-sm font-semibold text-green-300">Ei ole</p>
                </button>
              </div>
            )}
            {hasCabin === true && (
              <div className="space-y-3">
                <div><label className={labelCls}>Hinnasto</label><textarea value={s4.pricing_text} onChange={(e) => setS4((f) => ({ ...f, pricing_text: e.target.value }))} rows={3} placeholder="Jäsenet 50€/vkl, vieraat 80€/vkl" className={inputCls} /></div>
                <div><label className={labelCls}>Varausohjeet</label><textarea value={s4.instructions_text} onChange={(e) => setS4((f) => ({ ...f, instructions_text: e.target.value }))} rows={3} className={inputCls} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Hyväksyjän nimi</label><input type="text" value={s4.approver_name} onChange={(e) => setS4((f) => ({ ...f, approver_name: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Hyväksyjän sähköposti</label><input type="email" value={s4.approver_email} onChange={(e) => setS4((f) => ({ ...f, approver_email: e.target.value }))} className={inputCls} /></div>
                </div>
              </div>
            )}
            {hasCabin !== null && (
              <button onClick={() => void submitStep4()} disabled={busy} className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
                {busy ? 'Viimeistellään...' : 'Valmis! →'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
