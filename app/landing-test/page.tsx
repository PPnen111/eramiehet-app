'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, CreditCard, Target, Calendar, Home, FileText,
  ChevronDown, Menu, X, CheckCircle,
  ClipboardList, MessageSquare, Coins, BookOpen, Building, Ticket, Shield,
} from 'lucide-react'

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="scroll-animate border-b border-[#e0d8cc]">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left">
        <span className="font-medium text-[#1a1a1a]">{q}</span>
        <ChevronDown size={18} className={`text-[#4a4a4a] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-[#1e3d1e]">{a}</p>}
    </div>
  )
}

export default function LandingTestPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = document.querySelectorAll('.scroll-animate')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const navLinks = [
    { label: 'Ominaisuudet', href: '#features' },
    { label: 'Hinnoittelu', href: '#pricing' },
    { label: 'UKK', href: '#faq' },
  ]

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#1a1a1a]" style={{ scrollBehavior: 'smooth' }}>
      <style>{`
        .scroll-animate {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .scroll-animate.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          border-color: #1a5c2a;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        .scroll-animate.hover-lift.animate-in:hover {
          transform: translateY(-4px);
        }
      `}</style>
      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 z-50 w-full border-b border-[#e0d8cc]/50 bg-[#f5f0e8] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/landing-test" className="text-xl font-bold text-[#2d6a2d]">JahtiPro</Link>
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((l) => <a key={l.href} href={l.href} className="text-sm text-[#1e3d1e] hover:text-[#1a1a1a] transition-colors">{l.label}</a>)}
            <Link href="/login" className="text-sm text-[#1e3d1e] hover:text-[#1a1a1a]">Kirjaudu</Link>
            <Link href="/uusi" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors">Aloita kokeilu →</Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#2d6a2d]"><Menu size={24} /></button>
        </div>
        {menuOpen && (
          <div className="border-t border-[#e0d8cc] bg-[#f5f0e8] px-4 py-4 md:hidden space-y-3">
            {navLinks.map((l) => <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm text-[#1e3d1e]">{l.label}</a>)}
            <Link href="/login" className="block text-sm text-[#1e3d1e]">Kirjaudu</Link>
            <Link href="/uusi" className="block rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white">Aloita kokeilu →</Link>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-24 pb-16 px-4">
        <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-[#1a1a1a] lg:text-5xl">
              Käytä aikasi <span className="text-[#2d6a2d]">rakkaaseen harrastukseen.</span><br />Vähemmän hallintoon ja viestintään.
            </h1>
            <p className="mt-4 text-lg text-[#1e3d1e] leading-relaxed">
              Jäsenrekisteri, maksut, saalisilmoitukset ja paikkavaraukset yhdessä sovelluksessa. Suunniteltu suomalaisille metsästysseuroille.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/uusi" className="rounded-xl bg-green-600 px-6 py-3.5 text-base font-bold text-white hover:bg-green-500 transition-colors">
                Aloita ilmainen 14 pv kokeilu →
              </Link>
              <Link href="/demo" className="rounded-xl border border-[#e0d8cc] px-6 py-3.5 text-base font-semibold text-[#1e3d1e] hover:bg-white transition-colors">
                Kokeile demoa ensin →
              </Link>
            </div>
            <p className="mt-4 text-sm text-[#4a4a4a]">
              ✓ Ei luottokorttia &nbsp; ✓ Ei sitoumuksia &nbsp; ✓ Valmis 5 minuutissa
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-[#e0d8cc] bg-white overflow-hidden">
              <div className="flex items-center gap-1.5 bg-[#f0ebe3] px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-[#4a4a4a]">jahtipro.fi/dashboard</span>
              </div>
              <div className="flex items-center justify-center h-64 text-[#888888]">
                [Kuvakaappaus sovelluksesta]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <div className="border-y border-[#e0d8cc]/50 bg-white py-3 text-center text-sm text-[#2d6a2d]">
        Käytössä suomalaisissa metsästysseuroissa &bull; Yli 150 jäsentä hallittu &bull; 14 pv ilmainen kokeilu
      </div>

      {/* ═══ PROBLEM ═══ */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="scroll-animate text-3xl font-bold text-[#1a1a1a]">Tunnistatko nämä haasteet?</h2>
          <p className="scroll-animate mt-2 text-[#2d6a2d]">Useimmat metsästysseurat kärsivät samoista ongelmista</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ClipboardList, title: 'Jäsenlista Excelissä', text: 'Tiedosto vanhenee, pyörii sähköpostissa eikä ole koskaan ajan tasalla.' },
              { icon: MessageSquare, title: 'Tieto hukkuu WhatsAppiin', text: 'Tärkeät ilmoitukset katoavat viestien sekaan. Kaikki eivät näe kaikkea.' },
              { icon: Coins, title: 'Jäsenmaksut käsin', text: 'Maksujen seuranta on työlästä. Kuka on maksanut, kuka ei — vaikea pitää kirjaa.' },
              { icon: Target, title: 'Saalistilasto vaikea koota', text: 'Seurakohtainen saaliskirjanpito on hajallaan ja vuositason seuranta työlästä. JahtiPro mahdollistaa tarkan tiedon seuran riistakannasta ja sen verotuksesta — helpottaen paikallista seurantaa juuri niin tarkasti kuin tarvitaan.' },
              { icon: Building, title: 'Varattavien tilojen varaukset soitellen', text: 'Seuralla on vuokrauskohteita mutta varauskalenteri puuttuu. Varaukset sovitaan soittelemalla ja viestittelemällä — päällekkäisiä varauksia syntyy ja viestinvaihto lisääntyy turhaan.' },
              { icon: Ticket, title: 'Vierasluvat hukassa', text: 'Maksut kerätään käteisellä tai seuran tilille, seuranta pahimmillaan kerran vuodessa — eikä kukaan muista kuka oli vieraana ja kenen seurassa.' },
              { icon: Shield, title: 'Tieto sihteerin tikulla tai mustassa vihkossa', text: 'Seuran pöytäkirjat ja dokumentit löytyvät usein vain sihteerin muistitikulta tai siitä yhdestä kansiosta — jos silloinkin. JahtiProssa kaikki on kaikkien jäsenten saatavilla juuri silloin kun tietoa tarvitaan.' },
            ].map((c, i) => (
              <div
                key={i}
                style={{ transitionDelay: `${i * 100}ms` }}
                className="scroll-animate hover-lift rounded-2xl border border-[#e0d8cc] bg-white p-6 text-left"
              >
                <c.icon size={28} className="text-[#4a4a4a] mb-3" />
                <h3 className="font-semibold text-[#1a1a1a] mb-1">{c.title}</h3>
                <p className="text-sm text-[#1e3d1e] leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="scroll-animate text-3xl font-bold text-[#1a1a1a]">Kaikki yhdessä paikassa</h2>
          <p className="scroll-animate mt-2 text-[#2d6a2d]">JahtiPro korvaa Excelin, WhatsAppin, pöytäkirjamappien ja muistitikkujen viidakon yhdellä helpolla sovelluksella.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Users, title: 'Jäsenhallinta', text: 'Täydellinen jäsenrekisteri. Tuo jäsenet Excelistä tai lisää käsin. Kutsu jäsenet sovellukseen sähköpostilla.', badge: 'Kaikki paketit', accent: false },
              { icon: CreditCard, title: 'Laskutus ja maksut', text: 'Lähetä jäsenmaksulaskut sähköpostilla. Seuraa maksujen tilannetta reaaliajassa. Lähetä muistutuksia yhdellä klikkauksella.', badge: 'Kaikki paketit', accent: false },
              { icon: Target, title: 'Saalisilmoitukset', text: 'Kirjaa saalis kentällä puhelimella. Tilastot kertyvät automaattisesti. Seuraa seuran saalistilastoja vuosittain.', badge: 'Kaikki paketit', accent: false },
              { icon: Calendar, title: 'Tapahtumat', text: 'Luo kokouksia, talkoita ja metsästyspäiviä. Jäsenet näkevät tapahtumat omalla etusivullaan. Ilmoittautumiset helposti.', badge: 'Kaikki paketit', accent: false },
              { icon: Home, title: 'Eräkartanon varaukset', text: 'Varauskalenteri eräkartanolle, saunalle tai ampumaradalle. Hyväksyjille ilmoitus automaattisesti. Lähetä lasku varauksesta.', badge: 'Plus ja Pro', accent: false },
              { icon: FileText, title: 'Dokumentit', text: 'Jaa seuran asiakirjat, säännöt ja pöytäkirjat kaikkien jäsenten saataville. Turvallisesti tallessa pilvessä.', badge: 'Kaikki paketit', accent: false },
              { icon: Ticket, title: 'Vierasluvat', text: 'Ei enää lupasopimuksia WhatsAppissa tai sähköpostiketjuissa. Myönnä vierasluvat digitaalisesti, lähetä lasku suoraan sovelluksesta ja seuraa maksun tilaa muiden jäsenmaksujen rinnalla. Kaikki luvat tallessa yhdessä paikassa — historia löytyy aina tarvittaessa.', badge: 'Kaikki paketit', accent: true },
              { icon: Shield, title: 'Roolit ja käyttöoikeudet', text: 'Jaa oikeudet helposti — puheenjohtaja, sihteeri, hallitus tai tavallinen jäsen. Jokainen näkee ja tekee juuri sen mitä pitääkin. Uusi henkilö pääsee mukaan minuuteissa. Lisää rooleja tulossa.', badge: 'Kaikki paketit', accent: false },
            ].map((f, i) => (
              <div
                key={i}
                style={{ transitionDelay: `${i * 100}ms` }}
                className={`scroll-animate hover-lift rounded-2xl border p-6 text-left ${f.accent ? 'border-green-500 bg-white ring-2 ring-green-500/30' : 'border-[#e0d8cc] bg-white'}`}
              >
                <f.icon size={28} className="text-[#2d6a2d] mb-3" />
                <h3 className="font-semibold text-[#1a1a1a] mb-1">{f.title}</h3>
                <p className="text-sm text-[#1e3d1e] leading-relaxed mb-3">{f.text}</p>
                <span className="rounded-full bg-[#eaf3de] px-2.5 py-0.5 text-xs text-[#1e3d1e]">{f.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIAL ═══ */}
      <section id="testimonial" className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="scroll-animate text-3xl font-bold text-[#1a1a1a] mb-8">Mitä käyttäjät sanovat</h2>
          <div className="scroll-animate rounded-2xl border border-[#e0d8cc] bg-white p-8 text-left">
            <p className="text-4xl text-[#888888] mb-4">&ldquo;</p>
            <div className="space-y-4 text-lg italic text-[#1a1a1a] leading-relaxed">
              <p>Aiemmin meidän seurassa tieto oli hajallaan: WhatsApp-ryhmässä tiedotteet ja pöytäkirjat hukkuivat muun keskustelun sekaan, kotisivut olivat erikseen, jäsenlaskutus omassa paikassaan ja vierasluvat hoidettiin erillisten ohjeiden mukaan. Vieraslupametsästyksen seuraaminen oli käytännössä mahdotonta.</p>
              <p>JahtiPro kokosi kaiken yhteen. Nyt näemme reaaliajassa ketä on vieraana, onko maksut hoidettu ja kuka toimii isäntänä. Lisäksi jäsenten saalistilastot ovat helposti saatavilla, mikä antaa hyvän kokonaiskuvan alueen riistakannasta. Myös tiedot riistapelloista, ruokintapaikoista ja nuolukivistä löytyvät yhdestä paikasta – ja nähdään suoraan, kuka niitä hoitaa ja missä kunnossa ne ovat.</p>
              <p>Arki on selkeytynyt huomattavasti ja turha säätö on jäänyt pois. Tämä on juuri sellainen ratkaisu, jota meidän seurassa tarvittiin.</p>
            </div>
            <div className="mt-6">
              <p className="font-semibold text-[#1a1a1a]">Jari Simola</p>
              <p className="text-sm text-[#4a4a4a]">Hallituksen puheenjohtaja, Kyyjärven Erämiehet</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MIKSI JAHTIPRO ═══ */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="scroll-animate text-3xl font-bold text-[#1a1a1a] text-center mb-8">Miksi JahtiPro on tehty?</h2>
          <div className="scroll-animate rounded-2xl border-l-4 border-green-500 bg-white p-8">
            <div className="space-y-4 text-[#1a1a1a] leading-relaxed">
              <p>JahtiPro tehtiin, koska metsästysseuran arjessa liian moni asia on hajallaan. Jäsentiedot, viestintä, tapahtumat, dokumentit ja käytännön järjestelyt vievät aikaa etenkin silloin, kun seuraa pyöritetään vapaaehtoisvoimin.</p>
              <p>Monessa seurassa sama haaste toistuu: tärkeää työtä tehdään paljon, mutta hallinto kuormittaa turhaan.</p>
              <p>JahtiPro kokoaa seuran tärkeät toiminnot yhteen paikkaan, jotta arki olisi sujuvampaa ja aikaa jäisi enemmän itse metsästykseen ja seuran toimintaan. Palvelu on rakennettu yhdessä Kyyjärven Erämiesten kanssa — käytännön tarpeesta, oikeille metsästäjille.</p>
            </div>
            <div className="my-6 border-t border-[#e0d8cc]/50" />
            <p className="text-xl italic text-[#1e3d1e] leading-relaxed">&ldquo;Toivottavasti tämä tuo teille helpotusta ja vapauttaa aikaa itse rakkaaseen harrastukseen.&rdquo;</p>
            <p className="mt-4 text-sm italic text-[#2d6a2d]">– Pekka Paunonen, JahtiPron kehittäjä</p>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-[#1a1a1a]">Selkeä hinnoittelu</h2>
          <p className="mt-2 text-[#2d6a2d]">
            Yksi paketti, kaikki ominaisuudet. 14 pv ilmainen kokeilu.
          </p>
          <div className="mt-10 rounded-2xl bg-white p-8 text-left ring-2 ring-green-500/30 card-shadow">
            <h3 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">JahtiPro</h3>
            <p className="mt-2 text-[#2d6a2d]">129 € + 2 € / jäsen / vuosi</p>
            <p className="text-xs text-[#888888]">Maksimi 599 € / vuosi</p>
            <p className="text-xs text-[#888888]">sis. ALV 25,5 %</p>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {[
                { members: 30, price: 189 },
                { members: 100, price: 329 },
                { members: 235, price: 599 },
              ].map((ex) => (
                <div key={ex.members} className="rounded-xl bg-[#f0ebe3] px-3 py-2 text-center text-sm">
                  <p className="text-[#888888]">{ex.members} jäsentä</p>
                  <p className="font-bold tracking-tight text-[#1a1a1a]">{ex.price} €/v</p>
                </div>
              ))}
            </div>

            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                'Jäsenhallinta',
                'Maksut ja laskutus',
                'Saalisilmoitukset',
                'Tapahtumat',
                'Vierasluvat',
                'Useita vuokrattavia kohteita',
                'Dokumentit',
                'Rajaton jäsenmäärä',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                  <CheckCircle size={14} className="text-[#2d6a2d] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/uusi"
              className="mt-8 block rounded-xl bg-green-600 py-3 text-center text-sm font-bold text-white hover:bg-green-500 transition-colors"
            >
              Aloita 14 pv ilmainen kokeilu
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="scroll-animate text-3xl font-bold text-[#1a1a1a] text-center mb-8">Usein kysytyt kysymykset</h2>
          <FAQ q="Mikä JahtiPro on?" a="JahtiPro on metsästysseuroille suunniteltu palvelu, joka kokoaa seuran tärkeät tiedot ja toiminnot yhteen paikkaan. Sen avulla jäsenasiat, viestintä, tapahtumat, dokumentit ja käytännön hallinta pysyvät paremmin järjestyksessä." />
          <FAQ q="Kenelle JahtiPro sopii?" a="JahtiPro sopii metsästysseuroille, jotka haluavat helpottaa arkea, vähentää manuaalista työtä ja pitää seuran asiat selkeästi hallinnassa. Palvelu sopii sekä pienille että suuremmille seuroille." />
          <FAQ q="Mitä JahtiPro sisältää?" a="JahtiPro sisältää jäsenrekisterin, jäsenmaksujen hallinnan, tapahtumat ja ilmoittautumiset, dokumentit ja pöytäkirjat, saalisilmoitukset sekä vuokrattavien kohteiden hallinnan. Kokonaisuus riippuu valitusta paketista." />
          <FAQ q="Miten vierasluvat toimivat JahtiProssa?" a="Vierasluvat hoidetaan kokonaan sovelluksessa — ei enää puheluita, WhatsApp-sopimuksia tai käteismaksuja joita kukaan ei muista. Käytännössä: hallitus myöntää luvan sovelluksessa (vieraan nimi, isäntä, alue, päivämäärät, hinta), isäntä saa automaattisen ilmoituksen sähköpostiin ja lasku lähetetään yhdellä klikkauksella. Maksu siirtyy suoraan seuran maksujen seurantaan. Dashboardilta näet reaaliajassa kuka on vieraana, kuka toimii isäntänä ja onko maksu hoidettu. Kaikki luvat arkistoituvat automaattisesti — vuoden lopussa näet helposti kuinka monta lupaa myönnettiin ja paljonko tuloja kertyi." />
          <FAQ q="Voiko palvelua räätälöidä meidän seuralle?" a="Kyllä voi. JahtiPro on rakennettu joustavasti, ja monia asioita voi muokata suoraan sovelluksessa itse. Jos seurallanne on erityisiä tarpeita, omia toimintatapoja tai toiveita lisäominaisuuksista — jutellaan. Räätälöidään yhdessä teille sopiva ratkaisu. Ota yhteyttä: info@jahtipro.fi" />
          <FAQ q="Voiko JahtiProlla hallita vuokrapaikkoja tai muita seuran kohteita?" a="Kyllä. JahtiProhon voidaan sisällyttää myös eräkartanoiden, saunojen, ampumaratojen ja muiden seurakohtaisten kohteiden varauskalenteri. Hyväksyjille lähtee ilmoitus automaattisesti ja laskun voi lähettää suoraan sovelluksesta." />
          <FAQ q="Kuinka käyttöönotto toimii?" a="Käyttöönotto on tehty mahdollisimman helpoksi. Rekisteröidy osoitteessa jahtipro.fi/uusi, täytä seuran perustiedot ja tuo jäsenet Excel-tiedostosta. Palvelu on käytössä minuuteissa. Kaikkea ei tarvitse rakentaa kerralla valmiiksi." />
          <FAQ q="Tarvitaanko käyttöön teknistä osaamista?" a="Ei tarvita. JahtiPro on suunniteltu tavalliseen seurakäyttöön, joten sen käyttö ei vaadi teknistä taustaa. Tavoitteena on, että palvelu on selkeä ja helppo käyttää myös niille, jotka eivät käytä digitaalisia työkaluja paljon." />
          <FAQ q="Voiko eri jäsenille antaa erilaisia oikeuksia?" a="Kyllä. JahtiProssa on valmiit roolit: ylläpitäjä, hallitus ja jäsen. Uuden henkilön lisääminen ja oikeuksien muuttaminen onnistuu muutamalla klikkauksella — ei teknistä osaamista tarvita. Lisää rooleja on tulossa." />
          <FAQ q="Toimiiko JahtiPro puhelimella?" a="Kyllä. JahtiPro on suunniteltu toimimaan sujuvasti mobiililaitteilla ilman erillistä sovellusta. Tietoja voi tarkistaa ja käyttää helposti myös maastossa, kokouksissa ja liikkeellä ollessa." />
          <FAQ q="Ovatko seuran tiedot turvassa?" a="Kyllä. Jokaisen seuran tiedot ovat täysin erillään muista seuroista. Käyttöoikeuksia voidaan rajata käyttäjäroolien mukaan, joten oikeat tiedot ovat oikeiden henkilöiden saatavilla. JahtiPro on GDPR-yhteensopiva." />
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-[#1a1a1a]">Valmis aloittamaan?</h2>
          <p className="mt-3 text-[#1e3d1e]">Liity suomalaisten metsästysseurojen joukkoon. 14 päivää ilmaiseksi, ei sitoumuksia.</p>
          <Link href="/uusi" className="mt-8 inline-block rounded-xl bg-green-600 px-8 py-4 text-lg font-bold text-white hover:bg-green-500 transition-colors">
            Aloita ilmainen kokeilu →
          </Link>
          <p className="mt-4 text-sm text-[#888888]">
            Kysymyksiä? Ota yhteyttä:{' '}
            <a href="mailto:info@jahtipro.fi" className="text-[#2d6a2d] hover:text-[#1e3d1e]">info@jahtipro.fi</a>
          </p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#e0d8cc] py-6 px-4">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4 text-xs text-[#888888]">
          <p>© 2026 JahtiPro. Kaikki oikeudet pidätetään.</p>
          <a href="mailto:info@jahtipro.fi" className="hover:text-[#2d6a2d]">info@jahtipro.fi</a>
          <div className="flex gap-4">
            <Link href="/tietosuoja" className="hover:text-[#2d6a2d]">Tietosuojaseloste</Link>
            <Link href="/login" className="hover:text-[#2d6a2d]">Kirjaudu</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
