import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NewSaalisForm from './new-saalis-form'
import DeleteSaalisButton from './delete-saalis-button'

const elainLabels: Record<string, string> = {
  hirvi: 'Hirvi',
  valkohantapeura: 'Valkohäntäpeura',
  metsäkauris: 'Metsäkauris',
  karhu: 'Karhu',
  metsäjänis: 'Metsäjänis',
  fasaani: 'Fasaani',
  muu: 'Muu',
}

const elainBadge: Record<string, string> = {
  hirvi: 'bg-amber-900 text-amber-200',
  valkohantapeura: 'bg-stone-700 text-stone-200',
  metsäkauris: 'bg-yellow-900 text-yellow-200',
  karhu: 'bg-red-900 text-red-200',
  metsäjänis: 'bg-blue-900 text-blue-200',
  fasaani: 'bg-orange-900 text-orange-200',
  muu: 'bg-green-900 text-green-200',
}

const sukupuoliLabel: Record<string, string> = {
  uros: 'Uros',
  naaras: 'Naaras',
  tuntematon: '',
}

const ikaLabel: Record<string, string> = {
  vasa: 'Vasa',
  nuori: 'Nuori',
  aikuinen: 'Aikuinen',
  tuntematon: '',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

export default async function SaalisPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('club_members')
    .select('club_id, role')
    .eq('profile_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-green-300">
            Sinua ei ole vielä liitetty mihinkään seuraan. Ota yhteyttä johtokuntaan.
          </p>
        </div>
      </main>
    )
  }

  const isAdmin = membership.role === 'admin' || membership.role === 'board_member'

  const { data: saaliset } = await supabase
    .from('saalis')
    .select('id, elain, maara, sukupuoli, ika_luokka, paikka, kuvaus, pvm, profile_id, reporter_name')
    .eq('club_id', membership.club_id)
    .order('pvm', { ascending: false })

  const thisYear = new Date().getFullYear()
  const thisYearSaalis = (saaliset ?? []).filter(
    (s) => new Date(s.pvm).getFullYear() === thisYear
  )
  const olderSaalis = (saaliset ?? []).filter(
    (s) => new Date(s.pvm).getFullYear() < thisYear
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Saalisilmoitukset</h1>
          <NewSaalisForm clubId={membership.club_id} profileId={user.id} />
        </div>

        {/* Tänä vuonna */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
            {thisYear}
          </h2>
          {thisYearSaalis.length === 0 ? (
            <p className="text-sm text-green-600">Ei saalisilmoituksia tänä vuonna.</p>
          ) : (
            <div className="space-y-3">
              {thisYearSaalis.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-green-800 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            elainBadge[s.elain] ?? elainBadge.muu
                          }`}
                        >
                          {elainLabels[s.elain] ?? s.elain}
                        </span>
                        {s.maara > 1 && (
                          <span className="text-xs text-green-400">{s.maara} kpl</span>
                        )}
                        {sukupuoliLabel[s.sukupuoli] && (
                          <span className="text-xs text-green-500">
                            {sukupuoliLabel[s.sukupuoli]}
                          </span>
                        )}
                        {ikaLabel[s.ika_luokka] && (
                          <span className="text-xs text-green-500">
                            {ikaLabel[s.ika_luokka]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-green-300">
                        {formatDate(s.pvm)}
                        {s.reporter_name && (
                          <span className="ml-2 text-green-500">— {s.reporter_name}</span>
                        )}
                      </p>
                      {s.paikka && (
                        <p className="text-xs text-green-500">📍 {s.paikka}</p>
                      )}
                      {s.kuvaus && (
                        <p className="mt-1 text-sm text-green-400">{s.kuvaus}</p>
                      )}
                    </div>
                    {(isAdmin || s.profile_id === user.id) && (
                      <DeleteSaalisButton saalisId={s.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Aiemmat vuodet */}
        {olderSaalis.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-600">
              Aiemmat
            </h2>
            <div className="space-y-2">
              {olderSaalis.slice(0, 10).map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-green-900 bg-white/[0.03] p-3 opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {elainLabels[s.elain] ?? s.elain}
                        {s.maara > 1 && ` (${s.maara} kpl)`}
                      </p>
                      <p className="text-xs text-green-500">
                        {formatDate(s.pvm)}
                        {s.reporter_name && ` — ${s.reporter_name}`}
                      </p>
                    </div>
                    {(isAdmin || s.profile_id === user.id) && (
                      <DeleteSaalisButton saalisId={s.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
