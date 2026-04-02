'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Circle, AlertTriangle } from 'lucide-react'

type CheckItem = {
  id: string
  category: string
  label: string
  description?: string
}

const CHECKLIST: CheckItem[] = [
  // Kirjautuminen & käyttäjähallinta
  { id: 'login-email', category: 'Kirjautuminen', label: 'Kirjautuminen sähköpostilla ja salasanalla toimii' },
  { id: 'login-error', category: 'Kirjautuminen', label: 'Väärä salasana näyttää virheilmoituksen' },
  { id: 'password-reset', category: 'Kirjautuminen', label: 'Salasanan palautus: linkki saapuu sähköpostiin', description: 'Testaa "Unohdin salasanan" → sähköposti → uusi salasana → kirjautuminen' },
  { id: 'password-reset-redirect', category: 'Kirjautuminen', label: 'Palautuslinkki ohjaa oikealle sivulle (ei etusivulle)' },
  { id: 'logout', category: 'Kirjautuminen', label: 'Uloskirjautuminen toimii' },

  // Jäsenten kutsuminen
  { id: 'invite-single', category: 'Kutsut', label: 'Yksittäisen jäsenen kutsu sähköpostilla toimii', description: 'Hallinto → Jäsenet → Kirjekuori-ikoni → sähköposti saapuu' },
  { id: 'invite-all', category: 'Kutsut', label: '"Kutsu kaikki" lähettää kutsut kaikille ei-kirjautuneille' },
  { id: 'invite-email-content', category: 'Kutsut', label: 'Kutsusähköpostin sisältö on oikein', description: 'Tarkista: seuran nimi, linkki jahtipro.fi/login, sähköpostiosoite' },
  { id: 'invite-login', category: 'Kutsut', label: 'Kutsuttu jäsen pystyy kirjautumaan kutsulinkillä' },
  { id: 'invite-forgot', category: 'Kutsut', label: 'Kutsuttu jäsen pystyy vaihtamaan salasanan "Unohdin salasanan" -toiminnolla' },
  { id: 'add-member-form', category: 'Kutsut', label: '"Uusi jäsen" -lomake tallentaa kaikki kentät oikein' },
  { id: 'add-member-invite', category: 'Kutsut', label: '"Uusi jäsen" + kutsu-valintaruutu lähettää kutsusähköpostin' },

  // Jäsenrekisteri
  { id: 'members-list', category: 'Jäsenrekisteri', label: 'Jäsenlista näyttää kaikki jäsenet' },
  { id: 'members-profile', category: 'Jäsenrekisteri', label: 'Jäsenen profiilisivu näyttää tiedot oikein' },
  { id: 'members-edit', category: 'Jäsenrekisteri', label: 'Jäsenen tietojen muokkaus toimii' },
  { id: 'members-delete', category: 'Jäsenrekisteri', label: 'Jäsenen poistaminen toimii (vahvistus ensin)' },
  { id: 'members-import-csv', category: 'Jäsenrekisteri', label: 'CSV-tuonti toimii oikein' },
  { id: 'members-import-xlsx', category: 'Jäsenrekisteri', label: 'Excel (.xlsx) -tuonti toimii oikein' },
  { id: 'members-import-form', category: 'Jäsenrekisteri', label: 'Lomaketuonti (monta jäsentä kerralla) toimii' },

  // Dashboard & navigointi
  { id: 'dashboard-loads', category: 'Dashboard', label: 'Dashboard latautuu ilman virheitä' },
  { id: 'dashboard-cards', category: 'Dashboard', label: 'Dashboard-kortit näyttävät oikeat tiedot' },
  { id: 'navigation', category: 'Dashboard', label: 'Navigointi toimii kaikille sivuille (bottom nav)' },
  { id: 'mobile-responsive', category: 'Dashboard', label: 'Sovellus toimii mobiililla (responsiivisuus)' },

  // Tapahtumat
  { id: 'events-list', category: 'Tapahtumat', label: 'Tapahtumalista näkyy oikein (tulevat + menneet)' },
  { id: 'events-create', category: 'Tapahtumat', label: 'Uuden tapahtuman luonti toimii' },
  { id: 'events-edit', category: 'Tapahtumat', label: 'Tapahtuman muokkaus toimii' },
  { id: 'events-delete', category: 'Tapahtumat', label: 'Tapahtuman poistaminen toimii' },
  { id: 'events-types', category: 'Tapahtumat', label: 'Kaikki tapahtumatyypit näkyvät (talkoot, kokous, kilpailu, jne.)' },

  // Eräkartano (varaukset)
  { id: 'bookings-list', category: 'Eräkartano', label: 'Varauslista/kalenteri näkyy oikein' },
  { id: 'bookings-create', category: 'Eräkartano', label: 'Uuden varauksen tekeminen toimii' },
  { id: 'bookings-delete', category: 'Eräkartano', label: 'Varauksen peruuttaminen toimii' },

  // Maksut
  { id: 'payments-list', category: 'Maksut', label: 'Omat maksut näkyvät jäsenelle' },
  { id: 'payments-admin', category: 'Maksut', label: 'Hallitus voi luoda ja hallita maksuja' },

  // Saalisilmoitukset
  { id: 'saalis-list', category: 'Saalis', label: 'Saalisilmoitukset näkyvät' },
  { id: 'saalis-create', category: 'Saalis', label: 'Uuden saalisilmoituksen tekeminen toimii' },
  { id: 'saalis-delete', category: 'Saalis', label: 'Saalisilmoituksen poistaminen toimii' },

  // Dokumentit
  { id: 'docs-list', category: 'Dokumentit', label: 'Dokumenttilista näkyy oikein' },
  { id: 'docs-upload', category: 'Dokumentit', label: 'Dokumentin lataaminen onnistuu' },

  // Roolit & oikeudet
  { id: 'role-member', category: 'Oikeudet', label: 'Tavallinen jäsen EI näe Hallinto-sivua' },
  { id: 'role-board', category: 'Oikeudet', label: 'Johtokunta näkee Hallinto-sivun' },
  { id: 'role-admin', category: 'Oikeudet', label: 'Ylläpitäjä näkee kaiken' },
  { id: 'role-superadmin', category: 'Oikeudet', label: 'Superadmin voi hallita tapahtumia ja jäseniä' },
]

const STORAGE_KEY = 'jahtipro-launch-checklist'

export default function DevelopmentTab() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setChecked(new Set(JSON.parse(saved) as string[]))
    } catch { /* ignore */ }
  }, [])

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const categories = [...new Set(CHECKLIST.map((item) => item.category))]
  const total = CHECKLIST.length
  const done = checked.size
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">
            Tehtävä 00: Tarkastuslista ennen kutsuja
          </h2>
          <span className="text-sm font-semibold text-green-300">
            {done}/{total} ({percent}%)
          </span>
        </div>
        <div className="h-3 rounded-full bg-green-900/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        {percent < 100 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-yellow-400">
            <AlertTriangle size={14} />
            <span>Testaa kaikki kohdat ennen kuin lähetät kutsuja jäsenille!</span>
          </div>
        )}
        {percent === 100 && (
          <p className="mt-3 text-sm text-green-400 font-semibold">
            Kaikki testattu — valmis kutsujen lähettämiseen!
          </p>
        )}
      </div>

      {/* Categories */}
      {categories.map((cat) => {
        const items = CHECKLIST.filter((item) => item.category === cat)
        const catDone = items.filter((item) => checked.has(item.id)).length
        return (
          <div key={cat} className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-green-400">
                {cat}
              </h3>
              <span className="text-xs text-green-600">{catDone}/{items.length}</span>
            </div>
            <div className="space-y-1">
              {items.map((item) => {
                const isDone = checked.has(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isDone ? 'bg-green-900/20' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle size={18} className="mt-0.5 shrink-0 text-green-400" />
                    ) : (
                      <Circle size={18} className="mt-0.5 shrink-0 text-green-700" />
                    )}
                    <div>
                      <span className={`text-sm ${isDone ? 'text-green-400 line-through' : 'text-white'}`}>
                        {item.label}
                      </span>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-green-600">{item.description}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
