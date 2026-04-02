import Link from 'next/link'
import { Users, Mail } from 'lucide-react'

export default function RekisteroidyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-green-500">
            Erämiehet
          </p>
          <h1 className="text-3xl font-bold text-white">Aloita käyttö</h1>
          <p className="mt-2 text-sm text-green-400">
            Valitse vaihtoehto joka sopii tilanteeseesi
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-1">
          {/* Vaihtoehto A — Uusi seura — hidden: club registration disabled */}

          {/* Vaihtoehto B — Liity olemassa olevaan seuraan */}
          <div className="rounded-2xl border border-green-800 bg-white/[0.03] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-900">
                <Users size={20} className="text-green-300" />
              </div>
              <div>
                <h2 className="font-bold text-white">Liity seuraan</h2>
                <p className="text-xs text-green-500">Seurasi on jo rekisteröity</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-green-800/60 bg-green-950/40 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Mail size={14} className="text-green-400" />
                  <p className="text-sm font-medium text-green-300">Pyydä kutsu sähköpostitse</p>
                </div>
                <p className="text-sm text-green-500">
                  Pyydä seurasi ylläpitäjää lähettämään sinulle kutsu sähköpostitse.
                </p>
              </div>

              <p className="text-xs text-green-600">
                Ylläpitäjä voi lähettää kutsun <strong className="text-green-500">Hallinto</strong>-sivulta.
                Saat sähköpostiisi linkin, jonka kautta pääset rekisteröitymään suoraan oikeaan seuraan.
              </p>

              <Link
                href="/liity"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-700 py-2.5 text-sm font-semibold text-green-300 transition-colors hover:bg-green-900/40"
              >
                Minulla on kutsu →
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-green-600">
          Onko sinulla jo tili?{' '}
          <Link href="/login" className="font-medium text-green-400 hover:text-green-300">
            Kirjaudu sisään
          </Link>
        </p>
      </div>
    </main>
  )
}
