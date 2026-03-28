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
  Star,
  ChevronRight,
} from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Jäsenrekisteri', desc: 'Haku, roolit ja jäsenstatus. Kaikki yhdessä näkymässä.' },
  { icon: CalendarDays, title: 'Tapahtumat', desc: 'Talkoot, kokoukset ja jahtipäivät — jäsenet näkevät heti.' },
  { icon: Target, title: 'Saalisilmoitukset', desc: 'Kirjaa saalis 30 sekunnissa suoraan metsästä.' },
  { icon: Tent, title: 'Eräkartano', desc: 'Mökinvarauskalenteri — ei enää päällekkäisyyksiä.' },
  { icon: CreditCard, title: 'Maksut', desc: 'Jäsenmaksut ja jahtimaksut seurannassa reaaliajassa.' },
  { icon: FileText, title: 'Asiakirjat', desc: 'Säännöt ja pöytäkirjat aina kaikkien saatavilla.' },
  { icon: Map, title: 'Karttatunnukset', desc: 'Karttapalvelun tunnukset turvallisesti vain jäsenille.' },
  { icon: Mail, title: 'Kutsujärjestelmä', desc: 'Kutsu uusi jäsen sähköpostilla yhdellä klikkauksella.' },
]

const TESTIMONIALS = [
  {
    quote: 'Aiemmin kolme Excel-taulukkoa ja WhatsApp. Nyt kaikki yhdessä paikassa.',
    name: 'Matti K.',
    role: 'Puheenjohtaja, Pohjolan Eräseura',
  },
  {
    quote: 'Saalisilmoitus menee läpi 30 sekunnissa suoraan metsästä.',
    name: 'Jari L.',
    role: 'Jäsen, Keski-Suomen Hirviseurue',
  },
  {
    quote: 'Mökinvaraukset hoituvat itse — ei enää soittelua tai epäselvyyksiä.',
    name: 'Pekka S.',
    role: 'Sihteeri, Lapin Metsästäjät ry',
  },
]

const PLANS = [
  {
    name: 'Perus',
    price: '19',
    desc: 'Pienille seuroille',
    features: ['Jäsenrekisteri (max 50)', 'Tapahtumat', 'Saalisilmoitukset', 'Eräkartano', 'Asiakirjat'],
    cta: 'Valitse Perus',
    highlight: false,
  },
  {
    name: 'Standardi',
    price: '39',
    desc: 'Kasvavalle seuralle',
    badge: 'Suosituin',
    highlight: true,
    features: ['Kaikki Perus-ominaisuudet', 'Rajaton jäsenmäärä', 'Maksuseuranta', 'Prioriteettituki'],
    cta: 'Valitse Standardi',
  },
  {
    name: 'Pro',
    price: '79',
    desc: 'Suurille seuroille',
    features: ['Kaikki Standardi-ominaisuudet', 'Vuosikooste ja raportit', 'Taloussuunnittelu', 'Automaattiset muistutukset', 'Jäsentilastot'],
    cta: 'Valitse Pro',
    highlight: false,
  },
]

export default function LandingV2() {
  return (
    <div className="bg-white font-sans text-stone-900">

      {/* Nav */}
      <nav className="border-b border-stone-200 bg-white px-8 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-700">
              <Target size={15} className="text-white" />
            </div>
            <span className="font-bold text-stone-900">JahtiPro</span>
          </div>
          <div className="hidden items-center gap-7 text-sm text-stone-500 sm:flex">
            <span className="hover:text-stone-900 cursor-pointer">Ominaisuudet</span>
            <span className="hover:text-stone-900 cursor-pointer">Hinnat</span>
            <span className="hover:text-stone-900 cursor-pointer">Kirjaudu</span>
          </div>
          <button className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-600">
            Kokeile ilmaiseksi
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="border-b border-stone-100 bg-gradient-to-b from-stone-50 to-white px-8 pb-20 pt-16 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-semibold text-green-700">
          <Star size={11} className="fill-green-500 text-green-500" />
          Yli 120 metsästysseuraa käyttää jo
        </div>
        <h1 className="mx-auto max-w-2xl text-4xl font-black leading-tight tracking-tight text-stone-900 sm:text-5xl">
          Metsästysseura hallinnassa —{' '}
          <span className="text-green-700">vihdoinkin.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-stone-500">
          Jäsenrekisteri, saalisilmoitukset, mökinvaraukset ja tapahtumat. Kaikki yhdessä
          sovelluksessa. Lopeta Excel ja WhatsApp-kaos tänään.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-green-700 px-7 py-3.5 font-semibold text-white shadow-md hover:bg-green-600">
            Aloita 14 päivän kokeilu <ArrowRight size={16} />
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-7 py-3.5 font-semibold text-stone-700 hover:border-stone-300">
            Katso esittely <ChevronRight size={16} />
          </button>
        </div>
        <p className="mt-4 text-xs text-stone-400">Ei luottokorttia · Ei sitoumusta · Suomalainen palvelu</p>

        {/* Stats */}
        <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 divide-x divide-stone-200 rounded-2xl border border-stone-200 bg-white shadow-sm">
          {[
            { value: '120+', label: 'seuraa' },
            { value: '4 800+', label: 'jäsentä' },
            { value: '30 s', label: 'saalis kirjattu' },
          ].map(({ value, label }) => (
            <div key={label} className="px-4 py-5 text-center">
              <p className="text-xl font-extrabold text-green-700">{value}</p>
              <p className="mt-0.5 text-xs text-stone-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="px-8 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-green-600">Ominaisuudet</p>
          <h2 className="mb-2 text-center text-3xl font-extrabold text-stone-900">Kaikki mitä seura tarvitsee</h2>
          <p className="mb-12 text-center text-stone-500">Yhdessä sovelluksessa, kaikilla laitteilla.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-stone-200 bg-stone-50 p-4 transition-all hover:border-green-200 hover:bg-green-50"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 transition-colors group-hover:bg-green-200">
                  <Icon size={17} className="text-green-700" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-sm font-semibold text-stone-900">{title}</p>
                <p className="text-xs leading-relaxed text-stone-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="border-y border-stone-100 bg-stone-50 px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-extrabold text-stone-900">Mitä seurat sanovat</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <div key={name} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className="fill-green-500 text-green-500" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-stone-600">"{quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{name}</p>
                  <p className="text-xs text-stone-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="px-8 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-green-600">Hinnoittelu</p>
          <h2 className="mb-2 text-center text-3xl font-extrabold text-stone-900">Selvä hinta, ei yllätyksiä</h2>
          <p className="mb-12 text-center text-stone-500">Kaikki päivitykset sisältyvät kuukausimaksuun.</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {PLANS.map(({ name, price, desc, badge, highlight, features, cta }) => (
              <div
                key={name}
                className={`relative flex flex-col rounded-2xl p-6 ${
                  highlight
                    ? 'border-2 border-green-600 bg-green-700 text-white shadow-xl'
                    : 'border border-stone-200 bg-white shadow-sm'
                }`}
              >
                {badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-4 py-1 text-xs font-black text-white">
                    {badge}
                  </span>
                )}
                <div>
                  <p className={`font-bold ${highlight ? 'text-green-100' : 'text-stone-500'}`}>{name}</p>
                  <p className={`mt-0.5 text-xs ${highlight ? 'text-green-200' : 'text-stone-400'}`}>{desc}</p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black">{price}€</span>
                    <span className={`text-sm ${highlight ? 'text-green-200' : 'text-stone-400'}`}>/kk</span>
                  </p>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${highlight ? 'text-green-100' : 'text-stone-600'}`}>
                      <Check size={14} className={`mt-0.5 shrink-0 ${highlight ? 'text-green-300' : 'text-green-600'}`} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-7 w-full rounded-xl py-3 text-sm font-bold transition-all ${
                    highlight
                      ? 'bg-white text-green-800 hover:bg-green-50'
                      : 'border border-stone-200 text-stone-700 hover:border-green-300 hover:text-green-700'
                  }`}
                >
                  {cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-stone-100 bg-green-700 px-8 py-20 text-center text-white">
        <h2 className="text-3xl font-black sm:text-4xl">
          Valmis kokeilemaan?
        </h2>
        <p className="mt-3 text-green-200">
          Aloita 14 päivän maksuton kokeilu. Ei luottokorttia. Ei sitoumusta.
        </p>
        <button className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-green-800 shadow-lg hover:bg-green-50">
          Rekisteröi seurasi nyt <ArrowRight size={18} />
        </button>
        <p className="mt-4 text-xs text-green-300">Käyttövalmis 5 minuutissa · Suomalainen tuki</p>
      </div>

      {/* Footer */}
      <div className="border-t border-stone-200 px-8 py-5 text-center text-xs text-stone-400">
        © 2026 JahtiPro · Tietosuoja · Käyttöehdot · Tuki
      </div>
    </div>
  )
}
