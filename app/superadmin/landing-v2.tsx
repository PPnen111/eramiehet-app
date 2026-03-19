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
  Zap,
  Shield,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Users,
    title: 'Jäsenrekisteri',
    desc: 'Kaikki jäsentiedot yhdessä paikassa. Haku, roolit, jäsenstatus ja kutsujärjestelmä helposti hallittavissa.',
    color: 'from-green-600 to-emerald-600',
  },
  {
    icon: Target,
    title: 'Saalisilmoitukset',
    desc: 'Jäsen kirjaa saaliin 30 sekunnissa suoraan metsästä. Eläin, määrä, sukupuoli, ikäluokka ja paikka — automaattisesti.',
    color: 'from-teal-600 to-green-600',
  },
  {
    icon: Tent,
    title: 'Eräkartano',
    desc: 'Mökin varauskalenteri kaikkien nähtävillä reaaliajassa. Lopeta WhatsApp-kyselyt ja päällekkäiset varaukset.',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    icon: CreditCard,
    title: 'Maksuseuranta',
    desc: 'Jäsenmaksut, jahtimaksut, muut maksut — kaikki yhdessä. Jäsen näkee oman tilanteensa, hallitus kaikkien.',
    color: 'from-green-700 to-emerald-700',
  },
  {
    icon: CalendarDays,
    title: 'Tapahtumat',
    desc: 'Talkoot, kokoukset ja ampumaharjoitukset — jäsenet näkevät tulevat tapahtumat heti puhelimestaan.',
    color: 'from-teal-700 to-green-700',
  },
  {
    icon: FileText,
    title: 'Asiakirjat',
    desc: 'Säännöt, pöytäkirjat, ohjeet — aina saatavilla pilvestä. Ei enää etsimistä sähköposteista.',
    color: 'from-emerald-700 to-teal-700',
  },
]

const TESTIMONIALS = [
  {
    quote: 'Aiemmin käytimme kolmea eri Excel-taulukkoa ja WhatsAppia. Nyt kaikki on yhdessä paikassa.',
    name: 'Matti K.',
    role: 'Puheenjohtaja, Pohjolan Eräseura',
  },
  {
    quote: 'Saalisilmoitus menee läpi 30 sekunnissa suoraan metsästä. Ihan toisella tasolla kuin ennen.',
    name: 'Jari L.',
    role: 'Jäsen, Keski-Suomen Hirviseurue',
  },
  {
    quote: 'Mökinvaraukset hoituvat itse — ei enää soittelua tai epäselvyyksiä.',
    name: 'Pekka S.',
    role: 'Sihtee­ri, Lapin Metsästäjät ry',
  },
]

const PLANS = [
  {
    name: 'Perus',
    price: '19',
    desc: 'Pienille seuroille',
    features: ['Jäsenrekisteri (max 50)', 'Tapahtumat', 'Saalisilmoitukset', 'Eräkartano', 'Asiakirjat'],
    cta: 'Aloita Perus',
  },
  {
    name: 'Standardi',
    price: '39',
    desc: 'Kasvavalle seuralle',
    badge: 'Suosituin',
    highlight: true,
    features: ['Kaikki Perus-ominaisuudet', 'Rajaton jäsenmäärä', 'Maksuseuranta', 'Prioriteettituki'],
    cta: 'Aloita Standardi',
  },
  {
    name: 'Pro',
    price: '79',
    desc: 'Suurille seuroille',
    features: ['Kaikki Standardi-ominaisuudet', 'Vuosikooste ja raportit', 'Taloussuunnittelu', 'Automaattiset muistutukset', 'Jäsentilastot'],
    cta: 'Aloita Pro',
  },
]

const WHY = [
  { icon: Zap, text: 'Käyttövalmis päivässä — ei asennuksia' },
  { icon: Shield, text: 'Tietosi turvassa suomalaisilla palvelimilla' },
  { icon: Clock, text: 'Säästät 5–10 tuntia kuukaudessa' },
]

export default function LandingV2() {
  return (
    <div className="overflow-hidden rounded-2xl border border-green-800 bg-stone-950 font-sans text-white">

      {/* Nav */}
      <nav className="border-b border-white/10 bg-stone-950/80 px-8 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <Target size={16} className="text-white" />
            </div>
            <span className="font-bold tracking-tight text-white">Erämiesten App</span>
          </div>
          <div className="hidden items-center gap-8 text-sm text-stone-400 sm:flex">
            <span className="hover:text-white cursor-pointer">Ominaisuudet</span>
            <span className="hover:text-white cursor-pointer">Hinnat</span>
            <span className="hover:text-white cursor-pointer">Kirjaudu</span>
          </div>
          <button className="rounded-lg bg-green-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-green-900/40 hover:bg-green-500">
            Kokeile ilmaiseksi →
          </button>
        </div>
      </nav>

      {/* Hero — dark, dramatic */}
      <div className="relative overflow-hidden bg-stone-950 px-8 pb-24 pt-20 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-green-800/20 blur-[120px]" />
        </div>
        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-700/50 bg-green-900/30 px-4 py-1.5 text-xs font-semibold text-green-400">
            <Star size={11} className="fill-green-400 text-green-400" />
            Yli 120 metsästysseuraa käyttää jo
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl">
            Kaikki seuran hallinta<br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              yhdessä sovelluksessa.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-stone-400">
            Lopeta Excel-taulukot, WhatsApp-kaaos ja paperinen jäsenrekisteri.
            Erämiesten App pitää seurasi järjestyksessä — mobiilisti.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button className="flex items-center gap-2 rounded-xl bg-green-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-green-900/50 hover:bg-green-500">
              Aloita 14 päivän kokeilu <ArrowRight size={18} />
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-base font-semibold text-stone-300 hover:border-white/20 hover:text-white">
              Katso esittely <ChevronRight size={16} />
            </button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-stone-500">
            {['Ei luottokorttia', 'Ei sitoumusta', 'Suomalainen palvelu'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={11} className="text-green-600" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Why us — 3 pillars */}
      <div className="border-y border-white/5 bg-white/[0.02] px-8 py-8">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {WHY.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-stone-300">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-800/50">
                <Icon size={16} className="text-green-400" strokeWidth={1.5} />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Features — big cards */}
      <div className="px-8 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-green-500">Ominaisuudet</p>
          <h2 className="mb-3 text-center text-3xl font-extrabold">Kaikki mitä seura tarvitsee</h2>
          <p className="mb-12 text-center text-stone-400">Ei tarvita muita sovelluksia.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                  <Icon size={20} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-stone-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="border-t border-white/5 bg-white/[0.02] px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-extrabold">Mitä seurat sanovat</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className="fill-green-500 text-green-500" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-stone-300">"{quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-stone-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="px-8 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-green-500">Hinnoittelu</p>
          <h2 className="mb-3 text-center text-3xl font-extrabold">Selvä hinta, ei yllätyksiä</h2>
          <p className="mb-12 text-center text-stone-400">Kaikki päivitykset sisältyvät kuukausimaksuun.</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {PLANS.map(({ name, price, desc, badge, highlight, features, cta }) => (
              <div
                key={name}
                className={`relative flex flex-col rounded-2xl p-6 ${
                  highlight
                    ? 'border-2 border-green-500 bg-green-950 shadow-2xl shadow-green-900/40'
                    : 'border border-white/10 bg-white/[0.03]'
                }`}
              >
                {badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-4 py-1 text-xs font-black text-green-950">
                    {badge}
                  </span>
                )}
                <div>
                  <p className={`font-bold ${highlight ? 'text-green-300' : 'text-stone-300'}`}>{name}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{desc}</p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{price}€</span>
                    <span className="text-sm text-stone-500">/kk</span>
                  </p>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-stone-300">
                      <Check size={14} className="mt-0.5 shrink-0 text-green-500" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-7 w-full rounded-xl py-3 text-sm font-bold transition-all ${
                    highlight
                      ? 'bg-green-600 text-white shadow-lg shadow-green-900/50 hover:bg-green-500'
                      : 'border border-white/10 text-stone-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative overflow-hidden border-t border-white/5 px-8 py-20 text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-64 w-96 rounded-full bg-green-800/20 blur-[80px]" />
        </div>
        <div className="relative">
          <h2 className="text-3xl font-black sm:text-4xl">
            Valmis viemään seurasi<br />
            <span className="text-green-400">seuraavalle tasolle?</span>
          </h2>
          <p className="mt-4 text-stone-400">
            Aloita 14 päivän maksuton kokeilu. Ei luottokorttia. Ei sitoumusta.
          </p>
          <button className="mt-8 inline-flex items-center gap-2 rounded-xl bg-green-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-green-900/60 hover:bg-green-500">
            Rekisteröi seurasi nyt <ArrowRight size={18} />
          </button>
          <p className="mt-4 text-xs text-stone-600">
            Käyttövalmis 5 minuutissa · Suomalainen tuki
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <span className="font-semibold text-stone-500">Erämiesten App</span>
          <div className="flex gap-4">
            <span>Tietosuoja</span>
            <span>Käyttöehdot</span>
            <span>Tuki</span>
          </div>
          <span>© 2026</span>
        </div>
      </div>
    </div>
  )
}
