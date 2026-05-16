import Link from 'next/link'
import { Users, Mail } from 'lucide-react'

export default function RekisteroidyPage() {
  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#4a4a4a]">
            Erämiehet
          </p>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Aloita käyttö</h1>
          <p className="mt-2 text-sm text-[#2d6a2d]">
            Valitse vaihtoehto joka sopii tilanteeseesi
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-1">
          {/* Vaihtoehto A — Uusi seura — hidden: club registration disabled */}

          {/* Vaihtoehto B — Liity olemassa olevaan seuraan */}
          <div className="rounded-2xl border border-[#e0d8cc] bg-white/[0.03] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebe3]">
                <Users size={20} className="text-[#1e3d1e]" />
              </div>
              <div>
                <h2 className="font-bold text-[#1a1a1a]">Liity seuraan</h2>
                <p className="text-xs text-[#4a4a4a]">Seurasi on jo rekisteröity</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#e0d8cc]/60 bg-[#f5f0e8]/40 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Mail size={14} className="text-[#2d6a2d]" />
                  <p className="text-sm font-medium text-[#1e3d1e]">Pyydä kutsu sähköpostitse</p>
                </div>
                <p className="text-sm text-[#4a4a4a]">
                  Pyydä seurasi ylläpitäjää lähettämään sinulle kutsu sähköpostitse.
                </p>
              </div>

              <p className="text-xs text-[#888888]">
                Ylläpitäjä voi lähettää kutsun <strong className="text-[#4a4a4a]">Hallinto</strong>-sivulta.
                Saat sähköpostiisi linkin, jonka kautta pääset rekisteröitymään suoraan oikeaan seuraan.
              </p>

              <Link
                href="/liity"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e0d8cc] py-2.5 text-sm font-semibold text-[#1e3d1e] transition-colors hover:bg-white"
              >
                Minulla on kutsu →
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-[#888888]">
          Onko sinulla jo tili?{' '}
          <Link href="/login" className="font-medium text-[#2d6a2d] hover:text-[#1e3d1e]">
            Kirjaudu sisään
          </Link>
        </p>
      </div>
    </main>
  )
}
