'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

type Status = 'none' | 'green' | 'yellow' | 'red'

type CheckItem = {
  id: string
  category: string
  label: string
  description?: string
  claude: Status // Clauden arvio koodin perusteella
  claudeNote?: string
}

const CHECKLIST: CheckItem[] = [
  // Kirjautuminen
  { id: 'login-email', category: 'Kirjautuminen', label: 'Kirjautuminen sähköpostilla ja salasanalla toimii', claude: 'green', claudeNote: 'Koodi kunnossa, Supabase auth.signInWithPassword' },
  { id: 'login-error', category: 'Kirjautuminen', label: 'Väärä salasana näyttää virheilmoituksen', claude: 'green', claudeNote: 'Error-tila käsitelty login/page.tsx' },
  { id: 'password-reset', category: 'Kirjautuminen', label: 'Salasanan palautus: linkki saapuu sähköpostiin', claude: 'yellow', claudeNote: 'Koodi OK, mutta riippuu Supabasen redirect URL -asetuksista', description: 'Tarkista Supabase → Auth → URL Configuration' },
  { id: 'password-reset-redirect', category: 'Kirjautuminen', label: 'Palautuslinkki ohjaa oikealle sivulle', claude: 'green', claudeNote: 'auth/callback/route.ts käsittelee recovery-tyypin' },
  { id: 'logout', category: 'Kirjautuminen', label: 'Uloskirjautuminen toimii', claude: 'green', claudeNote: 'supabase.auth.signOut dashboard/logout-button.tsx' },

  // Kutsut
  { id: 'invite-single', category: 'Kutsut', label: 'Yksittäisen jäsenen kutsu sähköpostilla toimii', claude: 'yellow', claudeNote: 'Koodi OK, riippuu RESEND_API_KEY ympäristömuuttujasta', description: 'Hallinto → Jäsenet → Kirjekuori-ikoni' },
  { id: 'invite-all', category: 'Kutsut', label: '"Kutsu kaikki" lähettää kutsut ei-kirjautuneille', claude: 'yellow', claudeNote: 'invite-all/route.ts kunnossa, testaa sähköpostin saapuminen' },
  { id: 'invite-email-content', category: 'Kutsut', label: 'Kutsusähköpostin sisältö on oikein', claude: 'green', claudeNote: 'lib/emails/welcome.ts: seuran nimi, jahtipro.fi/login, email' },
  { id: 'invite-login', category: 'Kutsut', label: 'Kutsuttu jäsen pystyy kirjautumaan', claude: 'yellow', claudeNote: 'Auth user luodaan random-salasanalla → jäsenen pitää käyttää "Unohdin salasanan"' },
  { id: 'invite-forgot', category: 'Kutsut', label: 'Kutsuttu jäsen voi vaihtaa salasanan', claude: 'yellow', claudeNote: 'Riippuu password reset -flowsta (ks. yllä)' },
  { id: 'add-member-form', category: 'Kutsut', label: '"Uusi jäsen" -lomake tallentaa kentät', claude: 'green', claudeNote: 'POST /api/members upsertoi profileen kaikki kentät' },
  { id: 'add-member-invite', category: 'Kutsut', label: '"Uusi jäsen" + kutsu lähettää sähköpostin', claude: 'yellow', claudeNote: 'Koodi OK, testaa Resend-integraatio' },

  // Jäsenrekisteri
  { id: 'members-list', category: 'Jäsenrekisteri', label: 'Jäsenlista näyttää kaikki jäsenet', claude: 'green', claudeNote: 'GET /api/members hakee profiles + auth login status' },
  { id: 'members-profile', category: 'Jäsenrekisteri', label: 'Jäsenen profiilisivu näyttää tiedot', claude: 'green', claudeNote: 'jasenet/[id]/page.tsx hakee kaikki kentät' },
  { id: 'members-edit', category: 'Jäsenrekisteri', label: 'Jäsenen tietojen muokkaus toimii', claude: 'green', claudeNote: 'PATCH /api/members/[id] päivittää profiilia' },
  { id: 'members-delete', category: 'Jäsenrekisteri', label: 'Jäsenen poistaminen toimii', claude: 'green', claudeNote: 'DELETE /api/members/[id] + confirm-dialogi' },
  { id: 'members-import-csv', category: 'Jäsenrekisteri', label: 'CSV-tuonti toimii', claude: 'green', claudeNote: 'csv-parser.ts + import-members/route.ts' },
  { id: 'members-import-xlsx', category: 'Jäsenrekisteri', label: 'Excel (.xlsx) -tuonti toimii', claude: 'green', claudeNote: 'xlsx-parser.ts + sama route' },
  { id: 'members-import-form', category: 'Jäsenrekisteri', label: 'Lomaketuonti (monta jäsentä) toimii', claude: 'green', claudeNote: 'excel-import-form.tsx + import-members-form/route.ts' },

  // Dashboard
  { id: 'dashboard-loads', category: 'Dashboard', label: 'Dashboard latautuu ilman virheitä', claude: 'green', claudeNote: 'Server component, hakee profiili + seuratiedot' },
  { id: 'dashboard-cards', category: 'Dashboard', label: 'Dashboard-kortit näyttävät oikeat tiedot', claude: 'green', claudeNote: 'Laskelmat tehdään server-puolella' },
  { id: 'navigation', category: 'Dashboard', label: 'Navigointi toimii kaikille sivuille', claude: 'green', claudeNote: 'bottom-nav-client.tsx, kaikki reitit määritelty' },
  { id: 'mobile-responsive', category: 'Dashboard', label: 'Sovellus toimii mobiililla', claude: 'yellow', claudeNote: 'Tailwind mobile-first, mutta testaa oikealla laitteella' },

  // Tapahtumat
  { id: 'events-list', category: 'Tapahtumat', label: 'Tapahtumalista näkyy oikein', claude: 'green', claudeNote: 'Tulevat + menneet, active_club_id tuettu' },
  { id: 'events-create', category: 'Tapahtumat', label: 'Uuden tapahtuman luonti toimii', claude: 'green', claudeNote: 'create-event-form.tsx + supabase insert' },
  { id: 'events-edit', category: 'Tapahtumat', label: 'Tapahtuman muokkaus toimii', claude: 'green', claudeNote: 'edit-event-form.tsx + supabase update' },
  { id: 'events-delete', category: 'Tapahtumat', label: 'Tapahtuman poistaminen toimii', claude: 'green', claudeNote: 'delete-event-button.tsx + supabase delete' },
  { id: 'events-types', category: 'Tapahtumat', label: 'Kaikki tapahtumatyypit näkyvät', claude: 'green', claudeNote: '6 tyyppiä: talkoot, ampumaharjoitus, kokous, metsästyspäivä, kilpailu, muu' },

  // Eräkartano
  { id: 'bookings-list', category: 'Eräkartano', label: 'Varauslista/kalenteri näkyy oikein', claude: 'green', claudeNote: 'erakartano/page.tsx hakee bookings' },
  { id: 'bookings-create', category: 'Eräkartano', label: 'Uuden varauksen tekeminen toimii', claude: 'green', claudeNote: 'booking-form.tsx + supabase insert' },
  { id: 'bookings-delete', category: 'Eräkartano', label: 'Varauksen peruuttaminen toimii', claude: 'green', claudeNote: 'delete-booking-button.tsx' },

  // Maksut
  { id: 'payments-list', category: 'Maksut', label: 'Omat maksut näkyvät jäsenelle', claude: 'green', claudeNote: 'maksut/page.tsx hakee käyttäjän maksut' },
  { id: 'payments-admin', category: 'Maksut', label: 'Hallitus voi luoda ja hallita maksuja', claude: 'green', claudeNote: 'hallinto/tab-payments.tsx' },

  // Saalis
  { id: 'saalis-list', category: 'Saalis', label: 'Saalisilmoitukset näkyvät', claude: 'green', claudeNote: 'saalis/page.tsx hakee saalis-taulusta' },
  { id: 'saalis-create', category: 'Saalis', label: 'Uuden saalisilmoituksen tekeminen toimii', claude: 'green', claudeNote: 'new-saalis-form.tsx + supabase insert' },
  { id: 'saalis-delete', category: 'Saalis', label: 'Saalisilmoituksen poistaminen toimii', claude: 'green', claudeNote: 'delete-saalis-button.tsx' },

  // Dokumentit
  { id: 'docs-list', category: 'Dokumentit', label: 'Dokumenttilista näkyy oikein', claude: 'green', claudeNote: 'metsastajille/page.tsx + documents-taulu' },
  { id: 'docs-upload', category: 'Dokumentit', label: 'Dokumentin lataaminen onnistuu', claude: 'green', claudeNote: 'hallinto/tab-documents.tsx + storage bucket' },

  // Oikeudet
  { id: 'role-member', category: 'Oikeudet', label: 'Jäsen EI näe Hallinto-sivua', claude: 'green', claudeNote: 'hallinto/page.tsx tarkistaa isBoardOrAbove' },
  { id: 'role-board', category: 'Oikeudet', label: 'Johtokunta näkee Hallinto-sivun', claude: 'green', claudeNote: 'isBoardOrAbove sisältää board_member' },
  { id: 'role-admin', category: 'Oikeudet', label: 'Ylläpitäjä näkee kaiken', claude: 'green', claudeNote: 'admin sisältyy kaikkiin tarkistuksiin' },
  { id: 'role-superadmin', category: 'Oikeudet', label: 'Superadmin voi hallita tapahtumia ja jäseniä', claude: 'green', claudeNote: 'Korjattu: isBoardOrAbove + active_club_id' },
]

const STORAGE_KEY = 'jahtipro-checklist-user'

const STATUS_COLORS: Record<Status, string> = {
  none: 'bg-stone-700',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
}

const STATUS_RING: Record<Status, string> = {
  none: 'ring-stone-600',
  green: 'ring-green-400',
  yellow: 'ring-yellow-300',
  red: 'ring-red-400',
}

const CLAUDE_COLORS: Record<Status, string> = {
  none: 'bg-stone-700',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
}

function nextStatus(current: Status): Status {
  const order: Status[] = ['none', 'green', 'yellow', 'red']
  const idx = order.indexOf(current)
  return order[(idx + 1) % order.length]
}

export default function DevelopmentTab() {
  const [userStatus, setUserStatus] = useState<Record<string, Status>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setUserStatus(JSON.parse(saved) as Record<string, Status>)
    } catch { /* ignore */ }
  }, [])

  const toggleUser = (id: string) => {
    setUserStatus((prev) => {
      const current = prev[id] ?? 'none'
      const next = { ...prev, [id]: nextStatus(current) }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const categories = [...new Set(CHECKLIST.map((item) => item.category))]
  const total = CHECKLIST.length

  // Count user greens for progress
  const userGreens = CHECKLIST.filter((item) => userStatus[item.id] === 'green').length
  const userPercent = total > 0 ? Math.round((userGreens / total) * 100) : 0

  // Count claude status
  const claudeGreens = CHECKLIST.filter((item) => item.claude === 'green').length
  const claudeYellows = CHECKLIST.filter((item) => item.claude === 'yellow').length
  const claudeReds = CHECKLIST.filter((item) => item.claude === 'red').length

  return (
    <div className="space-y-6">
      {/* Header + legend */}
      <div className="rounded-2xl border border-green-800 bg-white/5 p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">
          Tehtävä 00: Tarkastuslista ennen kutsuja
        </h2>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-green-300">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
            Toimii
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" />
            Epävarma / testattava
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
            Ei toimi
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-stone-700" />
            Ei testattu
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-green-800 bg-white/[0.03] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2">Claude (koodiarvio)</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-green-400"><span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />{claudeGreens}</span>
              <span className="flex items-center gap-1 text-yellow-400"><span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />{claudeYellows}</span>
              <span className="flex items-center gap-1 text-red-400"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />{claudeReds}</span>
            </div>
          </div>
          <div className="rounded-xl border border-green-800 bg-white/[0.03] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2">Sinun testaus</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 rounded-full bg-green-900/50 overflow-hidden">
                <div className="h-full rounded-full bg-green-500 transition-all duration-300" style={{ width: `${userPercent}%` }} />
              </div>
              <span className="text-sm font-semibold text-green-300">{userGreens}/{total}</span>
            </div>
          </div>
        </div>

        {userPercent < 100 && (
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <AlertTriangle size={14} />
            <span>Klikkaa omaa ympyrää vaihtaaksesi tilaa: harmaa → vihreä → keltainen → punainen</span>
          </div>
        )}
        {userPercent === 100 && (
          <p className="text-sm text-green-400 font-semibold">
            Kaikki testattu — valmis kutsujen lähettämiseen!
          </p>
        )}
      </div>

      {/* Categories */}
      {categories.map((cat) => {
        const items = CHECKLIST.filter((item) => item.category === cat)
        return (
          <div key={cat} className="rounded-2xl border border-green-800 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-green-400">
                {cat}
              </h3>
              {/* Column headers */}
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-green-700">
                <span className="w-10 text-center">Claude</span>
                <span className="w-10 text-center">Sinä</span>
              </div>
            </div>
            <div className="space-y-0.5">
              {items.map((item) => {
                const uStatus = userStatus[item.id] ?? 'none'
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Label + description */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white">{item.label}</span>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-green-600">{item.description}</p>
                      )}
                      {item.claudeNote && (
                        <p className="mt-0.5 text-xs text-green-800 group-hover:text-green-600 transition-colors">
                          Claude: {item.claudeNote}
                        </p>
                      )}
                    </div>

                    {/* Claude status (static) */}
                    <div className="w-10 flex justify-center" title={`Claude: ${item.claude}`}>
                      <span className={`inline-block h-4 w-4 rounded-full ${CLAUDE_COLORS[item.claude]} shadow-sm`} />
                    </div>

                    {/* User status (clickable) */}
                    <div className="w-10 flex justify-center">
                      <button
                        onClick={() => toggleUser(item.id)}
                        title="Klikkaa vaihtaaksesi: harmaa → vihreä → keltainen → punainen"
                        className={`h-5 w-5 rounded-full ${STATUS_COLORS[uStatus]} ring-2 ${STATUS_RING[uStatus]} hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-sm`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
