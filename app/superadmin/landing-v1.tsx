import {
  Users,
  CalendarDays,
  Target,
  Tent,
  CreditCard,
  FileText,
  Map,
  Mail,
  ArrowRight,
  Check,
} from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Jäsenrekisteri', desc: 'Kaikki jäsentiedot yhdessä paikassa.' },
  { icon: CalendarDays, title: 'Tapahtumat', desc: 'Talkoot, kokoukset ja metsästyspäivät.' },
  { icon: Target, title: 'Saalisilmoitukset', desc: 'Kirjaa saalis suoraan metsästä.' },
  { icon: Tent, title: 'Eräkartano', desc: 'Mökin varauskalenteri — ei ristiriitoja.' },
  { icon: CreditCard, title: 'Maksut', desc: 'Jäsenmaksut ja jahtimaksut seurannassa.' },
  { icon: FileText, title: 'Asiakirjat', desc: 'Säännöt ja pöytäkirjat aina saatavilla.' },
  { icon: Map, title: 'Karttatunnukset', desc: 'Karttapalvelujen tunnukset turvallisesti.' },
  { icon: Mail, title: 'Kutsujärjestelmä', desc: 'Kutsu uusi jäsen yhdellä klikkauksella.' },
]

const PLANS = [
  {
    name: 'Perus',
    price: '19',
    features: ['Jäsenrekisteri (max 50)', 'Tapahtumat', 'Saalisilmoitukset', 'Eräkartano', 'Asiakirjat'],
  },
  {
    name: 'Standardi',
    price: '39',
    badge: 'Suosituin',
    highlight: true,
    features: ['Kaikki Perus-ominaisuudet', 'Rajaton jäsenmäärä', 'Maksuseuranta', 'Prioriteettituki'],
  },
  {
    name: 'Pro',
    price: '79',
    features: ['Kaikki Standardi-ominaisuudet', 'Vuosikooste ja raportit', 'Taloussuunnittelu', 'Automaattiset muistutukset', 'Jäsentilastot'],
  },
]

export default function LandingV1() {
  return (
    <div className="rounded-2xl border border-green-800 bg-green-950 font-sans text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-green-900 px-8 py-4">
        <span className="text-lg font-bold tracking-tight text-green-300">JahtiPro</span>
        <div className="hidden items-center gap-6 text-sm text-green-400 sm:flex">
          <span>Ominaisuudet</span>
          <span>Hinnat</span>
          <span>Kirjaudu</span>
        </div>
        <button className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-500">
          Aloita ilmaiseksi
        </button>
      </nav>

      {/* Hero */}
      <div className="px-8 py-20 text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-green-500">
          Metsästysseuroille tehty
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Metsästysseura<br />
          <span className="text-green-400">hallinnassa.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-green-300/70">
          Jäsenrekisteri, saalisilmoitukset, mökinvaraukset ja tapahtumat — kaikki yhdessä
          sovelluksessa. Lopeta Excel-taulukot ja WhatsApp-kaos tänään.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-500">
            Aloita 14 päivän kokeilu <ArrowRight size={16} />
          </button>
          <button className="rounded-xl border border-green-700 px-6 py-3 font-semibold text-green-300 hover:border-green-500 hover:text-white">
            Katso esittely
          </button>
        </div>
        <p className="mt-4 text-xs text-green-600">Ei luottokorttia · Ei sitoumusta · Suomalainen palvelu</p>
      </div>

      {/* Divider stat row */}
      <div className="border-y border-green-900 bg-green-900/20 px-8 py-6">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 text-center">
          {[
            { value: '120+', label: 'metsästysseuraa' },
            { value: '4 800+', label: 'aktiivista jäsentä' },
            { value: '30 s', label: 'saalisilmoitus' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-green-300">{value}</p>
              <p className="mt-0.5 text-xs text-green-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="px-8 py-16">
        <h2 className="mb-2 text-center text-2xl font-bold">Kaikki mitä seura tarvitsee</h2>
        <p className="mb-10 text-center text-sm text-green-400">Yhdessä sovelluksessa, kaikilla laitteilla.</p>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-green-900 bg-green-900/20 p-4 transition-all hover:border-green-700 hover:bg-green-900/40"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-green-800/60 transition-colors group-hover:bg-green-700/60">
                <Icon size={18} className="text-green-400" strokeWidth={1.5} />
              </div>
              <p className="mb-1 text-sm font-semibold text-white">{title}</p>
              <p className="text-xs leading-relaxed text-green-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="border-t border-green-900 px-8 py-16">
        <h2 className="mb-2 text-center text-2xl font-bold">Yksinkertainen hinnoittelu</h2>
        <p className="mb-10 text-center text-sm text-green-400">Yksi kuukausimaksu, kaikki ominaisuudet käytössä.</p>
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS.map(({ name, price, badge, highlight, features }) => (
            <div
              key={name}
              className={`relative rounded-2xl border p-6 ${
                highlight
                  ? 'border-green-500 bg-green-900/30 ring-1 ring-green-500/30'
                  : 'border-green-900 bg-green-900/10'
              }`}
            >
              {badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-0.5 text-xs font-bold text-green-950">
                  {badge}
                </span>
              )}
              <p className="font-semibold text-green-300">{name}</p>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">{price}€</span>
                <span className="text-sm text-green-500">/kk</span>
              </p>
              <ul className="mt-4 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-green-300">
                    <Check size={13} className="mt-0.5 shrink-0 text-green-500" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  highlight
                    ? 'bg-green-600 text-white hover:bg-green-500'
                    : 'border border-green-700 text-green-300 hover:border-green-500 hover:text-white'
                }`}
              >
                Valitse {name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA footer */}
      <div className="border-t border-green-900 px-8 py-14 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Valmis kokeilemaan?
        </h2>
        <p className="mt-3 text-sm text-green-400">
          Aloita 14 päivän maksuton kokeilu — ei luottokorttia tarvita.
        </p>
        {/* Rekisteröi seurasi -painike hidden */}
      </div>

      {/* Footer */}
      <div className="border-t border-green-900 px-8 py-5 text-center text-xs text-green-700">
        © 2026 JahtiPro · Suomalainen palvelu · Tietosuoja
      </div>
    </div>
  )
}
