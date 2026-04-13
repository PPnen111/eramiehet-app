'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, CreditCard, Target, Calendar, Home, FileText,
  ChevronDown, Play, Menu, X, CheckCircle, XCircle,
  ClipboardList, MessageSquare, Coins, BookOpen, Building,
} from 'lucide-react'

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-green-800">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left">
        <span className="font-medium text-white">{q}</span>
        <ChevronDown size={18} className={`text-green-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-green-300">{a}</p>}
    </div>
  )
}

export default function LandingTestPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Ominaisuudet', href: '#features' },
    { label: 'Hinnoittelu', href: '#pricing' },
    { label: 'UKK', href: '#faq' },
  ]

  return (
    <div className="min-h-screen bg-green-950 text-white" style={{ scrollBehavior: 'smooth' }}>
      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 z-50 w-full border-b border-green-800/50 bg-green-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/landing-test" className="text-xl font-bold text-green-400">JahtiPro</Link>
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((l) => <a key={l.href} href={l.href} className="text-sm text-green-300 hover:text-white transition-colors">{l.label}</a>)}
            <Link href="/login" className="text-sm text-green-300 hover:text-white">Kirjaudu</Link>
            <Link href="/uusi" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors">Aloita kokeilu →</Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-green-400"><Menu size={24} /></button>
        </div>
        {menuOpen && (
          <div className="border-t border-green-800 bg-green-950 px-4 py-4 md:hidden space-y-3">
            {navLinks.map((l) => <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm text-green-300">{l.label}</a>)}
            <Link href="/login" className="block text-sm text-green-300">Kirjaudu</Link>
            <Link href="/uusi" className="block rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white">Aloita kokeilu →</Link>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-24 pb-16 px-4">
        <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-white lg:text-5xl">
              Metsästysseurasi hallinta — <span className="text-green-400">helposti</span>
            </h1>
            <p className="mt-4 text-lg text-green-300 leading-relaxed">
              Jäsenrekisteri, maksut, saalisilmoitukset ja eräkartanon varaukset yhdessä sovelluksessa. Suunniteltu suomalaisille metsästysseuroille.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/uusi" className="rounded-xl bg-green-600 px-6 py-3.5 text-base font-bold text-white hover:bg-green-500 transition-colors">
                Aloita ilmainen 14 pv kokeilu →
              </Link>
              <a href="#video" className="rounded-xl border border-green-700 px-6 py-3.5 text-base font-semibold text-green-300 hover:bg-green-900/40 transition-colors">
                Katso esittely
              </a>
            </div>
            <p className="mt-4 text-sm text-green-500">
              ✓ Ei luottokorttia &nbsp; ✓ Ei sitoumuksia &nbsp; ✓ Valmis 5 minuutissa
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-green-700 bg-green-900/30 overflow-hidden">
              <div className="flex items-center gap-1.5 bg-green-900/60 px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-green-500">jahtipro.fi/dashboard</span>
              </div>
              <div className="flex items-center justify-center h-64 text-green-600">
                [Kuvakaappaus sovelluksesta]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <div className="border-y border-green-800/50 bg-green-900/20 py-3 text-center text-sm text-green-400">
        Käytössä suomalaisissa metsästysseuroissa &bull; Yli 150 jäsentä hallittu &bull; 14 pv ilmainen kokeilu
      </div>

      {/* ═══ PROBLEM ═══ */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-white">Tunnistatko nämä haasteet?</h2>
          <p className="mt-2 text-green-400">Useimmat metsästysseurat kärsivät samoista ongelmista</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ClipboardList, title: 'Jäsenlista Excelissä', text: 'Tiedosto vanhenee, pyörii sähköpostissa eikä ole koskaan ajan tasalla.' },
              { icon: MessageSquare, title: 'Tieto hukkuu WhatsAppiin', text: 'Tärkeät ilmoitukset katoavat viestien sekaan. Kaikki eivät näe kaikkea.' },
              { icon: Coins, title: 'Jäsenmaksut käsin', text: 'Maksujen seuranta on työlästä. Kuka on maksanut, kuka ei — vaikea pitää kirjaa.' },
              { icon: Target, title: 'Saaliit vihkoon', text: 'Saalisilmoitukset paperille tai tekstiviestillä. Tilastojen kokoaminen vie tunteja.' },
              { icon: Building, title: 'Eräkartanon varaukset soitellen', text: 'Varauskalenteri puuttuu. Päällekkäisiä varauksia tulee, viestittely lisääntyy.' },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl border border-green-800 bg-green-900/30 p-6 text-left">
                <c.icon size={28} className="text-green-500 mb-3" />
                <h3 className="font-semibold text-white mb-1">{c.title}</h3>
                <p className="text-sm text-green-300 leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 px-4 bg-green-900/10">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-white">Kaikki yhdessä paikassa</h2>
          <p className="mt-2 text-green-400">JahtiPro korvaa Excelin, WhatsAppin ja paperilaput yhdellä helpolla sovelluksella</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Users, title: 'Jäsenhallinta', text: 'Täydellinen jäsenrekisteri. Tuo jäsenet Excelistä tai lisää käsin. Kutsu jäsenet sovellukseen sähköpostilla.', badge: 'Kaikki paketit' },
              { icon: CreditCard, title: 'Laskutus ja maksut', text: 'Lähetä jäsenmaksulaskut sähköpostilla. Seuraa maksujen tilannetta reaaliajassa. Lähetä muistutuksia yhdellä klikkauksella.', badge: 'Kaikki paketit' },
              { icon: Target, title: 'Saalisilmoitukset', text: 'Kirjaa saalis kentällä puhelimella. Tilastot kertyvät automaattisesti. Seuraa seuran saalistilastoja vuosittain.', badge: 'Kaikki paketit' },
              { icon: Calendar, title: 'Tapahtumat', text: 'Luo kokouksia, talkoita ja metsästyspäiviä. Jäsenet näkevät tapahtumat omalla etusivullaan. Ilmoittautumiset helposti.', badge: 'Kaikki paketit' },
              { icon: Home, title: 'Eräkartanon varaukset', text: 'Varauskalenteri eräkartanolle, saunalle tai ampumaradalle. Hyväksyjille ilmoitus automaattisesti. Lähetä lasku varauksesta.', badge: 'Plus ja Pro' },
              { icon: FileText, title: 'Dokumentit', text: 'Jaa seuran asiakirjat, säännöt ja pöytäkirjat kaikkien jäsenten saataville. Turvallisesti tallessa pilvessä.', badge: 'Kaikki paketit' },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-green-800 bg-green-900/30 p-6 text-left">
                <f.icon size={28} className="text-green-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-green-300 leading-relaxed mb-3">{f.text}</p>
                <span className="rounded-full bg-green-800/60 px-2.5 py-0.5 text-xs text-green-300">{f.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VIDEO ═══ */}
      <section id="video" className="py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white">Katso miten JahtiPro toimii</h2>
          <p className="mt-2 text-green-400">3 minuuttia — näet kaiken oleellisen</p>
          <div className="mt-8 rounded-2xl border border-green-800 bg-green-900/30 flex flex-col items-center justify-center h-80">
            <Play size={48} className="text-green-500 mb-3" />
            <p className="text-green-500">[Video tulossa]</p>
            <p className="text-xs text-green-700 mt-1">Esittelyvideo lisätään pian</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-green-800 bg-green-900/20 flex items-center justify-center h-40 text-sm text-green-600">[Kuvakaappaus: Jäsenhallinta]</div>
            <div className="rounded-xl border border-green-800 bg-green-900/20 flex items-center justify-center h-40 text-sm text-green-600">[Kuvakaappaus: Maksut]</div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIAL ═══ */}
      <section id="testimonial" className="py-20 px-4 bg-green-900/10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Mitä käyttäjät sanovat</h2>
          <div className="rounded-2xl border border-green-800 bg-green-900/30 p-8">
            <p className="text-4xl text-green-600 mb-4">&ldquo;</p>
            <p className="text-lg italic text-green-200 leading-relaxed">[Testimonial tulossa — Jari Simola, Kyyjärven Erämiehet]</p>
            <div className="mt-6">
              <p className="font-semibold text-white">Jari Simola</p>
              <p className="text-sm text-green-500">Hallituksen jäsen, Kyyjärven Erämiehet</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-green-700">Lisää arvosteluja tulossa</p>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-20 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-white">Selkeä hinnoittelu</h2>
          <p className="mt-2 text-green-400">Valitse seurallesi sopiva paketti. Kaikki paketit sisältävät 14 pv ilmaisen kokeilun.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { name: 'Jahti Start', price: '225', monthly: '18,75', popular: false, features: ['50 jäsentä', '1 vuokrattava kohde', '10 dokumenttia', 'Jäsenhallinta', 'Maksut ja laskutus', 'Saalisilmoitukset', 'Tapahtumat'], missing: ['Useita vuokrattavia kohteita', 'Laaja raportointi'] },
              { name: 'Jahti Plus', price: '395', monthly: '32,92', popular: true, features: ['150 jäsentä', '3 vuokrattavaa kohdetta', '50 dokumenttia', 'Jäsenhallinta', 'Maksut ja laskutus', 'Saalisilmoitukset', 'Tapahtumat', 'Useita vuokrattavia kohteita'], missing: ['Laaja raportointi'] },
              { name: 'Jahti Pro', price: '625', monthly: '52,08', popular: false, features: ['Rajaton jäsenmäärä', 'Rajaton kohteet', 'Rajaton dokumentit', 'Jäsenhallinta', 'Maksut ja laskutus', 'Saalisilmoitukset', 'Tapahtumat', 'Useita vuokrattavia kohteita', 'Laaja raportointi (tulossa)'], missing: [] },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl border p-6 text-left relative ${p.popular ? 'border-green-500 bg-green-900/40 ring-2 ring-green-500/30' : 'border-green-800 bg-green-900/20'}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-3 py-0.5 text-xs font-bold text-white">Suosituin</span>}
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="mt-2"><span className="text-3xl font-extrabold text-white">{p.price} €</span><span className="text-green-400">/vuosi</span></p>
                <p className="text-sm text-green-500">({p.monthly} €/kk)</p>
                <ul className="mt-6 space-y-2">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-green-200"><CheckCircle size={14} className="text-green-400 shrink-0" />{f}</li>
                  ))}
                  {p.missing.map((m, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-green-600"><XCircle size={14} className="text-green-800 shrink-0" />{m}</li>
                  ))}
                </ul>
                <Link href="/uusi" className={`mt-6 block rounded-xl py-3 text-center text-sm font-bold transition-colors ${p.popular ? 'bg-green-600 text-white hover:bg-green-500' : 'border border-green-700 text-green-300 hover:bg-green-900/40'}`}>
                  Aloita kokeilu
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-green-700">Kaikki hinnat sis. ALV 25,5%</p>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-20 px-4 bg-green-900/10">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Usein kysytyt kysymykset</h2>
          <FAQ q="Mikä JahtiPro on?" a="JahtiPro on metsästysseuroille suunniteltu palvelu, joka kokoaa seuran tärkeät tiedot ja toiminnot yhteen paikkaan. Sen avulla jäsenasiat, viestintä, tapahtumat, dokumentit ja käytännön hallinta pysyvät paremmin järjestyksessä." />
          <FAQ q="Kenelle JahtiPro sopii?" a="JahtiPro sopii metsästysseuroille, jotka haluavat helpottaa arkea, vähentää manuaalista työtä ja pitää seuran asiat selkeästi hallinnassa. Palvelu sopii sekä pienille että suuremmille seuroille." />
          <FAQ q="Mitä JahtiPro sisältää?" a="JahtiPro sisältää jäsenrekisterin, jäsenmaksujen hallinnan, tapahtumat ja ilmoittautumiset, dokumentit ja pöytäkirjat, saalisilmoitukset sekä vuokrattavien kohteiden hallinnan. Kokonaisuus riippuu valitusta paketista." />
          <FAQ q="Voiko palvelua räätälöidä meidän seuralle?" a="Kyllä voi. JahtiPro on rakennettu niin, että sitä voidaan mukauttaa seuran omiin tarpeisiin. Tämä on hyödyllistä erityisesti silloin, jos seuralla on omia toimintatapoja, erityisiä rooleja tai tarvetta lisäominaisuuksille. Ota yhteyttä info@jahtipro.fi niin jutellaan lisää." />
          <FAQ q="Voiko JahtiProlla hallita vuokrapaikkoja tai muita seuran kohteita?" a="Kyllä. JahtiProhon voidaan sisällyttää myös eräkartanoiden, saunojen, ampumaratojen ja muiden seurakohtaisten kohteiden varauskalenteri. Hyväksyjille lähtee ilmoitus automaattisesti ja laskun voi lähettää suoraan sovelluksesta." />
          <FAQ q="Kuinka käyttöönotto toimii?" a="Käyttöönotto on tehty mahdollisimman helpoksi. Rekisteröidy osoitteessa jahtipro.fi/uusi, täytä seuran perustiedot ja tuo jäsenet Excel-tiedostosta. Palvelu on käytössä minuuteissa. Kaikkea ei tarvitse rakentaa kerralla valmiiksi." />
          <FAQ q="Tarvitaanko käyttöön teknistä osaamista?" a="Ei tarvita. JahtiPro on suunniteltu tavalliseen seurakäyttöön, joten sen käyttö ei vaadi teknistä taustaa. Tavoitteena on, että palvelu on selkeä ja helppo käyttää myös niille, jotka eivät käytä digitaalisia työkaluja paljon." />
          <FAQ q="Toimiiko JahtiPro puhelimella?" a="Kyllä. JahtiPro on suunniteltu toimimaan sujuvasti mobiililaitteilla ilman erillistä sovellusta. Tietoja voi tarkistaa ja käyttää helposti myös maastossa, kokouksissa ja liikkeellä ollessa." />
          <FAQ q="Ovatko seuran tiedot turvassa?" a="Kyllä. Jokaisen seuran tiedot ovat täysin erillään muista seuroista. Käyttöoikeuksia voidaan rajata käyttäjäroolien mukaan, joten oikeat tiedot ovat oikeiden henkilöiden saatavilla. JahtiPro on GDPR-yhteensopiva." />
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">Valmis aloittamaan?</h2>
          <p className="mt-3 text-green-300">Liity suomalaisten metsästysseurojen joukkoon. 14 päivää ilmaiseksi, ei sitoumuksia.</p>
          <Link href="/uusi" className="mt-8 inline-block rounded-xl bg-green-600 px-8 py-4 text-lg font-bold text-white hover:bg-green-500 transition-colors">
            Aloita ilmainen kokeilu →
          </Link>
          <p className="mt-4 text-sm text-green-600">
            Kysymyksiä? Ota yhteyttä:{' '}
            <a href="mailto:info@jahtipro.fi" className="text-green-400 hover:text-green-300">info@jahtipro.fi</a>
          </p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-green-800 py-6 px-4">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4 text-xs text-green-600">
          <p>© 2026 JahtiPro. Kaikki oikeudet pidätetään.</p>
          <a href="mailto:info@jahtipro.fi" className="hover:text-green-400">info@jahtipro.fi</a>
          <div className="flex gap-4">
            <Link href="/tietosuoja" className="hover:text-green-400">Tietosuojaseloste</Link>
            <Link href="/login" className="hover:text-green-400">Kirjaudu</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
