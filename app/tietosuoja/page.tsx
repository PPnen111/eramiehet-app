import Link from 'next/link'

export default function TietosuojaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-10 pb-24">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-block text-sm text-green-400 hover:text-green-300">
          ← Etusivulle
        </Link>

        <h1 className="mb-1 text-3xl font-extrabold text-white">Tietosuojaseloste</h1>
        <p className="mb-10 text-sm text-green-500">Päivitetty 26.3.2026</p>

        <div className="space-y-8 text-sm leading-7 text-green-200">

          {/* 1 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">1. Rekisterinpitäjä</h2>
            <p>
              JahtiPro<br />
              Yhteyshenkilö: Pekka Paunonen<br />
              Sähköposti:{' '}
              <a
                href="mailto:paunonen@gmail.com"
                className="text-green-400 underline hover:text-green-300"
              >
                paunonen@gmail.com
              </a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">2. Kerättävät henkilötiedot</h2>
            <p className="mb-2">Sovellus kerää seuraavia henkilötietoja:</p>
            <ul className="ml-4 list-disc space-y-1 text-green-300">
              <li>Nimi</li>
              <li>Sähköpostiosoite</li>
              <li>Puhelinnumero</li>
              <li>Jäsenyystiedot (seura, rooli, liittymispäivä)</li>
              <li>Saalisilmoitukset</li>
              <li>Sovelluksen käyttötiedot (kirjautumiset, sivulataukset)</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">3. Tietojen käyttötarkoitus</h2>
            <p className="mb-2">Henkilötietoja käytetään seuraaviin tarkoituksiin:</p>
            <ul className="ml-4 list-disc space-y-1 text-green-300">
              <li>Jäsenrekisterin ylläpito</li>
              <li>Tapahtumien ja varausten hallinta</li>
              <li>Maksujen seuranta</li>
              <li>Viestintä jäsenille</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">4. Tietojen säilytys</h2>
            <p>
              Henkilötietoja säilytetään niin kauan kuin jäsenyys on voimassa. Jäsenyyden
              päättyessä tiedot poistetaan 12 kuukauden kuluessa.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">5. Tietojen luovutus</h2>
            <p className="mb-2">
              Henkilötietoja ei luovuteta kolmansille osapuolille. Tekniset
              palveluntarjoajat, joita käytämme:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-green-300">
              <li>Supabase (tietokanta, EU:ssa)</li>
              <li>Vercel (palvelin, EU:ssa)</li>
              <li>Resend (sähköposti)</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">6. Rekisteröidyn oikeudet</h2>
            <p className="mb-2">Sinulla on oikeus:</p>
            <ul className="ml-4 list-disc space-y-1 text-green-300">
              <li>Tarkastaa omat tietosi</li>
              <li>Korjata virheelliset tiedot</li>
              <li>Poistaa tietosi</li>
              <li>Siirtää tietosi toiseen palveluun</li>
            </ul>
            <p className="mt-3 rounded-xl border border-green-800 bg-white/5 px-4 py-3 text-green-300">
              Voit käyttää oikeuksiasi kirjautumalla sovellukseen ja menemällä{' '}
              <Link href="/profiili" className="font-medium text-green-400 underline hover:text-green-300">
                Profiili-sivulle
              </Link>
              .
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-2 text-base font-bold text-white">7. Yhteystiedot</h2>
            <p>
              Tietosuojaan liittyvissä kysymyksissä ota yhteyttä:{' '}
              <a
                href="mailto:paunonen@gmail.com"
                className="text-green-400 underline hover:text-green-300"
              >
                paunonen@gmail.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
