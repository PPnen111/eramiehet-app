import {
  Users,
  CalendarDays,
  Target,
  Tent,
  CreditCard,
  FileText,
  Map,
  Mail,
  Check,
  Shield,
  User,
  Briefcase,
  Code2,
  Database,
  Globe,
  Layers,
  Lock,
  Smartphone,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Users,
    title: 'Jäsenrekisteri',
    desc: 'Kaikki jäsentiedot yhdessä paikassa. Haku, roolit ja jäsenstatus helposti hallittavissa.',
  },
  {
    icon: CalendarDays,
    title: 'Tapahtumat',
    desc: 'Talkoot, kokoukset, ampumaharjoitukset ja metsästyspäivät. Jäsenet näkevät tulevat tapahtumat heti sovelluksesta.',
  },
  {
    icon: Target,
    title: 'Saalisilmoitukset',
    desc: 'Jäsen ilmoittaa saaliin sekunneissa suoraan metsästä. Eläin, määrä, sukupuoli, ikäluokka ja paikka tallennetaan automaattisesti.',
  },
  {
    icon: Tent,
    title: 'Eräkartano',
    desc: 'Mökin varauskalenteri kaikkien nähtävillä. Ei enää päällekkäisiä varauksia tai WhatsApp-kyselyjä.',
  },
  {
    icon: CreditCard,
    title: 'Maksut',
    desc: 'Jäsenmaksut, jahtimaksut ja muut maksut seurannassa. Jäsen näkee oman tilanteensa, hallitus näkee kaikkien tilanteen.',
  },
  {
    icon: FileText,
    title: 'Asiakirjat',
    desc: 'Säännöt, pöytäkirjat ja ohjeet aina saatavilla. Ei enää etsimistä sähköposteista tai kovalevyiltä.',
  },
  {
    icon: Map,
    title: 'Karttatunnukset',
    desc: 'Karttapalvelujen tunnukset turvallisesti tallennettuna. Vain jäsenet näkevät ne.',
  },
  {
    icon: Mail,
    title: 'Kutsujärjestelmä',
    desc: 'Hallitus kutsuu uudet jäsenet sähköpostitse. Jäsen rekisteröityy yhdellä klikkauksella.',
  },
]

const BENEFITS = [
  {
    icon: Shield,
    title: 'Puheenjohtaja / Hallitus',
    color: 'text-green-300',
    borderColor: 'border-green-700',
    bgColor: 'bg-green-900/20',
    items: [
      'Säästät 5–10 tuntia kuukaudessa',
      'Jäsenrekisteri aina ajan tasalla',
      'Maksutilanne yhdellä silmäyksellä',
      'Asiakirjat järjestyksessä',
      'Tapahtumat helppo tiedottaa',
    ],
  },
  {
    icon: User,
    title: 'Tavallinen jäsen',
    color: 'text-emerald-300',
    borderColor: 'border-emerald-700',
    bgColor: 'bg-emerald-900/20',
    items: [
      'Kaikki seuran tieto puhelimessa',
      'Saalis ilmoitettu 30 sekunnissa',
      'Varaa mökki milloin tahansa',
      'Tapahtumat aina tiedossa',
      'Omat maksut näkyvissä',
    ],
  },
  {
    icon: Briefcase,
    title: 'Toiminnanjohtaja',
    color: 'text-teal-300',
    borderColor: 'border-teal-700',
    bgColor: 'bg-teal-900/20',
    items: [
      'Yksi paikka kaikelle',
      'Ei enää Excel-taulukoita',
      'Ei enää WhatsApp-kaaosta',
      'Uudet jäsenet helppo lisätä',
      'Historia tallessa digitaalisesti',
    ],
  },
]

const PLANS = [
  {
    name: 'Perus',
    price: '19',
    highlight: false,
    features: [
      'Jäsenrekisteri (max 50 jäsentä)',
      'Tapahtumat',
      'Saalisilmoitukset',
      'Eräkartanon varaukset',
      'Asiakirjat',
    ],
  },
  {
    name: 'Standardi',
    price: '39',
    badge: 'Suosituin',
    highlight: true,
    features: [
      'Kaikki Perus-ominaisuudet',
      'Rajaton jäsenmäärä',
      'Maksuseuranta',
      'Prioriteettituki',
    ],
  },
  {
    name: 'Pro',
    price: '79',
    highlight: false,
    features: [
      'Kaikki Standardi-ominaisuudet',
      'Vuosikooste ja raportit',
      'Taloussuunnittelu',
      'Automaattiset muistutukset',
      'Jäsentilastot',
    ],
  },
]

const TECH = [
  { icon: Code2, label: 'Next.js 16, TypeScript, Tailwind CSS v4' },
  { icon: Database, label: 'Supabase (PostgreSQL, Auth, Storage)' },
  { icon: Globe, label: 'Vercel deployment' },
  { icon: Layers, label: 'Multi-tenant arkkitehtuuri' },
  { icon: Lock, label: 'Row Level Security kaikissa tauluissa' },
  { icon: Smartphone, label: 'Mobiili-ensisijainen suunnittelu' },
]

export default function InfoTab() {
  return (
    <div className="space-y-12">

      {/* ── Section 1: Mitä sovellus tekee ── */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-white">Mitä Erämiesten App tekee?</h2>
        <p className="mb-6 text-sm text-green-400">
          Kaikki metsästysseuran tarvitsemat työkalut yhdessä mobiilisovelluksessa.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-green-800 bg-white/5 p-4 transition-colors hover:border-green-600 hover:bg-white/[0.08]"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-800/60">
                <Icon size={20} className="text-green-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-1.5 font-semibold text-white">{title}</h3>
              <p className="text-xs leading-relaxed text-green-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Hyödyt ── */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-white">Hyödyt eri käyttäjille</h2>
        <p className="mb-6 text-sm text-green-400">
          Sovellus palvelee jokaista seuran jäsentä heidän roolinsa mukaan.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, color, borderColor, bgColor, items }) => (
            <div
              key={title}
              className={`rounded-2xl border ${borderColor} ${bgColor} p-5`}
            >
              <div className={`mb-1 flex items-center gap-2 font-semibold ${color}`}>
                <Icon size={16} strokeWidth={1.5} />
                {title}
              </div>
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-green-300">
                    <Check size={14} className="mt-0.5 shrink-0 text-green-500" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Hinnoittelu ── */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-white">Hinnoittelu</h2>
        <p className="mb-6 text-sm text-green-400">Kuukausimaksu sisältää kaikki päivitykset.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS.map(({ name, price, badge, highlight, features }) => (
            <div
              key={name}
              className={`relative rounded-2xl border p-5 ${
                highlight
                  ? 'border-green-500 bg-green-900/30 ring-1 ring-green-500/40'
                  : 'border-green-800 bg-white/5'
              }`}
            >
              {badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-0.5 text-xs font-bold text-green-950">
                  {badge}
                </span>
              )}
              <p className={`font-bold ${highlight ? 'text-green-300' : 'text-white'}`}>{name}</p>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{price}€</span>
                <span className="text-sm text-green-500">/kk</span>
              </p>
              <ul className="mt-4 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-green-300">
                    <Check size={14} className="mt-0.5 shrink-0 text-green-500" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Tekninen info ── */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-white">Tekninen info</h2>
        <p className="mb-4 text-sm text-green-400">Sovelluksen tekniset tiedot superadminille.</p>
        <div className="rounded-2xl border border-green-800 bg-white/5 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TECH.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-800/40">
                  <Icon size={15} className="text-green-400" strokeWidth={1.5} />
                </div>
                <span className="text-sm text-green-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
