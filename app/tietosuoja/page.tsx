import Link from 'next/link'
import BackButton from './back-button'
import CloseTabButton from './close-tab-button'

export default function TietosuojaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-10 pb-24">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <BackButton />
          <CloseTabButton />
        </div>

        <h1 className="mb-1 text-3xl font-extrabold text-white">Tietosuojaseloste</h1>
        <p className="mb-10 text-sm text-green-500">Päivitetty 11.4.2026</p>

        <div className="space-y-8 text-sm leading-7 text-green-200">

          {/* 1 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">1. Rekisterinpitäjä ja käsittelijä</h2>
            <p className="mb-3">
              <strong className="text-white">JahtiPro</strong><br />
              Yhteyshenkilö: Pekka Paunonen<br />
              Sähköposti:{' '}
              <a href="mailto:info@jahtipro.fi" className="text-green-400 underline hover:text-green-300">
                info@jahtipro.fi
              </a><br />
              Verkkosivu: jahtipro.fi
            </p>
            <div className="rounded-xl border border-green-800 bg-white/5 px-4 py-3 text-green-300">
              <p className="font-medium text-white mb-1">Multi-tenant -malli</p>
              <p>
                Jokainen metsästysseura on itsenäinen rekisterinpitäjä omien jäsentensä
                henkilötietojen osalta. JahtiPro toimii henkilötietojen käsittelijänä
                (GDPR art. 28) ja tarjoaa teknisen alustan jäsentietojen hallintaan.
                Seuran hallitus vastaa siitä, että jäsentietojen käsittely on lainmukaista.
              </p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">2. Kerättävät henkilötiedot</h2>
            <p className="mb-2">Sovellus kerää seuraavia henkilötietoja:</p>
            <ul className="ml-4 list-disc space-y-1 text-green-300">
              <li>Nimi, sähköpostiosoite ja puhelinnumero</li>
              <li>Syntymäaika (jäsenrekisteri)</li>
              <li>Osoitetiedot (katuosoite, postinumero, postitoimipaikka, kotikunta)</li>
              <li>Jäsenyystiedot (seura, rooli, jäsenlaji, jäsennumero, liittymispäivä)</li>
              <li>Saalisilmoitukset (eläin, määrä, paikka, päivämäärä)</li>
              <li>Tilavaraukset (eräkartano, varausajankohta, varaajan nimi)</li>
              <li>Maksutiedot (jäsenmaksut, summat, tilanne — ei korttitietoja)</li>
              <li>Kirjautumis- ja tapahtumaloki (aikaleima, IP-osoite, toiminto)</li>
              <li>Karttapalvelujen kirjautumistiedot</li>
              <li>Laskutusosoite ja laskutustapa</li>
            </ul>
            <p className="mt-2 text-xs text-green-500">
              JahtiPro ei kerää eikä tallenna maksukorttitietoja. Maksut käsitellään tilisiirtona.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">3. Tietojen käyttötarkoitus</h2>
            <p className="mb-2">Henkilötietoja käytetään seuraaviin tarkoituksiin:</p>
            <ul className="ml-4 list-disc space-y-1 text-green-300">
              <li>Jäsenrekisterin ylläpito ja jäsenhallinta</li>
              <li>Tapahtumien ja kokousten hallinta</li>
              <li>Tilavarausten (eräkartano) hallinta</li>
              <li>Jäsenmaksujen laskutus ja seuranta</li>
              <li>Saalisilmoitusten hallinta ja tilastointi</li>
              <li>Viestintä jäsenille (sähköposti-ilmoitukset, kutsut, muistutukset)</li>
              <li>Dokumenttien hallinta (pöytäkirjat, säännöt)</li>
              <li>Palvelun tietoturvan varmistaminen ja väärinkäytösten estäminen</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">4. Käsittelyn oikeusperuste (GDPR art. 6)</h2>
            <ul className="ml-4 list-disc space-y-2 text-green-300">
              <li>
                <strong className="text-white">Sopimus (art. 6.1.b):</strong>{' '}
                Henkilötietojen käsittely on tarpeen jäsenyyteen perustuvan sopimussuhteen
                täyttämiseksi (jäsenrekisteri, laskutus, viestintä).
              </li>
              <li>
                <strong className="text-white">Oikeutettu etu (art. 6.1.f):</strong>{' '}
                Tietoturvalokien ylläpito palvelun turvallisuuden varmistamiseksi ja
                väärinkäytösten estämiseksi.
              </li>
              <li>
                <strong className="text-white">Lakisääteinen velvoite (art. 6.1.c):</strong>{' '}
                Kirjanpitolain edellyttämien maksutietojen säilyttäminen.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">5. Tietojen säilytysajat</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-800">
                    <th className="px-3 py-2 text-left text-xs text-green-400">Tietotyyppi</th>
                    <th className="px-3 py-2 text-left text-xs text-green-400">Säilytysaika</th>
                  </tr>
                </thead>
                <tbody className="text-green-300">
                  <tr className="border-b border-green-900/30"><td className="px-3 py-2">Jäsentiedot</td><td className="px-3 py-2">Jäsenyyden ajan + 5 vuotta</td></tr>
                  <tr className="border-b border-green-900/30"><td className="px-3 py-2">Tapahtumaloki</td><td className="px-3 py-2">24 kuukautta</td></tr>
                  <tr className="border-b border-green-900/30"><td className="px-3 py-2">Maksutiedot</td><td className="px-3 py-2">10 vuotta (kirjanpitolaki)</td></tr>
                  <tr className="border-b border-green-900/30"><td className="px-3 py-2">Saalisilmoitukset</td><td className="px-3 py-2">Toistaiseksi (tilastointitarve)</td></tr>
                  <tr><td className="px-3 py-2">Varaukset</td><td className="px-3 py-2">5 vuotta</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">6. Tietojen luovutus ja alikäsittelijät</h2>
            <p className="mb-2">
              Henkilötietoja ei luovuteta kolmansille osapuolille markkinointitarkoituksiin.
              Tietojen käsittelyssä käytetään seuraavia teknisiä palveluntarjoajia
              (alikäsittelijöitä):
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-800">
                    <th className="px-3 py-2 text-left text-xs text-green-400">Palvelu</th>
                    <th className="px-3 py-2 text-left text-xs text-green-400">Käyttötarkoitus</th>
                    <th className="px-3 py-2 text-left text-xs text-green-400">Sijainti</th>
                    <th className="px-3 py-2 text-left text-xs text-green-400">Siirtoperuste</th>
                  </tr>
                </thead>
                <tbody className="text-green-300">
                  <tr className="border-b border-green-900/30">
                    <td className="px-3 py-2">Supabase Inc.</td>
                    <td className="px-3 py-2">Tietokanta ja autentikointi</td>
                    <td className="px-3 py-2">EU / USA</td>
                    <td className="px-3 py-2">SCC</td>
                  </tr>
                  <tr className="border-b border-green-900/30">
                    <td className="px-3 py-2">Vercel Inc.</td>
                    <td className="px-3 py-2">Sovelluksen hosting</td>
                    <td className="px-3 py-2">EU / USA</td>
                    <td className="px-3 py-2">SCC</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Resend Inc.</td>
                    <td className="px-3 py-2">Sähköpostien lähetys</td>
                    <td className="px-3 py-2">USA</td>
                    <td className="px-3 py-2">SCC</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-green-500">
              SCC = EU:n vakiosopimuslausekkeet (Standard Contractual Clauses, GDPR art. 46.2.c)
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">7. Rekisteröidyn oikeudet</h2>
            <p className="mb-2">Sinulla on EU:n yleisen tietosuoja-asetuksen mukaisesti oikeus:</p>
            <ul className="ml-4 list-disc space-y-1 text-green-300">
              <li><strong className="text-white">Tarkastusoikeus</strong> — Pyytää tiedot siitä, mitä henkilötietoja sinusta on tallennettu</li>
              <li><strong className="text-white">Oikaisuoikeus</strong> — Korjata virheelliset tai puutteelliset tiedot</li>
              <li><strong className="text-white">Poisto-oikeus</strong> — Pyytää tietojesi poistamista (&quot;oikeus tulla unohdetuksi&quot;)</li>
              <li><strong className="text-white">Rajoittamisoikeus</strong> — Rajoittaa tietojesi käsittelyä tietyissä tilanteissa</li>
              <li><strong className="text-white">Siirto-oikeus</strong> — Siirtää tietosi toiseen palveluun koneluettavassa muodossa</li>
              <li><strong className="text-white">Valitusoikeus</strong> — Tehdä valitus tietosuojaviranomaiselle</li>
            </ul>
            <div className="mt-3 rounded-xl border border-green-800 bg-white/5 px-4 py-3 text-green-300">
              <p>
                Voit tarkastella ja muokata tietojasi kirjautumalla sovellukseen ja menemällä{' '}
                <Link href="/profiili" className="font-medium text-green-400 underline hover:text-green-300">
                  Profiili-sivulle
                </Link>
                . Muut pyynnöt:{' '}
                <a href="mailto:info@jahtipro.fi" className="text-green-400 underline hover:text-green-300">
                  info@jahtipro.fi
                </a>
              </p>
            </div>
            <p className="mt-2 text-xs text-green-500">
              Tietosuojavaltuutetun toimisto: tietosuoja.fi — Valitus tulee tehdä kuuden kuukauden kuluessa.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">8. Evästeet</h2>
            <p>
              JahtiPro käyttää ainoastaan palvelun toiminnalle välttämättömiä istuntoevästeitä
              (session cookies) sisäänkirjautumisen ylläpitämiseen. Sovellus ei käytä
              mainosevästeitä, analytiikkaevästeitä eikä kolmannen osapuolen seurantaevästeitä.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">9. Tietoturva</h2>
            <ul className="ml-4 list-disc space-y-1 text-green-300">
              <li>Kaikki tietoliikenne on salattu (HTTPS/TLS)</li>
              <li>Tietokanta on suojattu rivitason suojauksella (Row Level Security)</li>
              <li>Pääsynhallinta perustuu rooleihin (jäsen, hallituksen jäsen, admin)</li>
              <li>Tapahtumaloki kirjaa kaikki kriittiset toiminnot</li>
              <li>Tenant-eristys estää seurojen välisen tietovuodon</li>
              <li>Salasanat tallennetaan hajautettuna (bcrypt)</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">10. Yhteystiedot</h2>
            <p>
              Tietosuojaan liittyvissä kysymyksissä ja oikeuspyynnöissä ota yhteyttä:{' '}
              <a href="mailto:info@jahtipro.fi" className="text-green-400 underline hover:text-green-300">
                info@jahtipro.fi
              </a>
            </p>
            <p className="mt-2 text-xs text-green-500">
              Vastaamme tietosuojapyyntöihin 30 päivän kuluessa GDPR:n mukaisesti.
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
