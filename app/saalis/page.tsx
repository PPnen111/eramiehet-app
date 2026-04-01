import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NewSaalisForm from './new-saalis-form'
import SaalisFilter from './saalis-filter'

const elainLabels: Record<string, string> = {
  metso: 'Metso', teeri: 'Teeri', pyy: 'Pyy', riekko: 'Riekko',
  sinisorsa: 'Sinisorsa', tavi: 'Tavi', haapana: 'Haapana',
  jouhisorsa: 'Jouhisorsa', heinätavi: 'Heinätavi', lapasorsa: 'Lapasorsa',
  tukkasotka: 'Tukkasotka', telkkä: 'Telkkä', isokoskelo: 'Isokoskelo',
  tukkakoskelo: 'Tukkakoskelo', metsähanhi: 'Metsähanhi',
  merihanhi: 'Merihanhi', kanadanhanhi: 'Kanadanhanhi',
  sepelkyyhky: 'Sepelkyyhky', uuttukyyhky: 'Uuttukyyhky',
  fasaani: 'Fasaani', lehtokurppa: 'Lehtokurppa',
  nokikana: 'Nokikana', varis: 'Varis', harakka: 'Harakka', naakka: 'Naakka',
  metsäjänis: 'Metsäjänis', rusakko: 'Rusakko',
  euroopanmajava: 'Euroopanmajava',
  kettu: 'Kettu', mäyrä: 'Mäyrä', kärppä: 'Kärppä',
  hilleri: 'Hilleri', näätä: 'Näätä',
  pienpedot: 'Pienpedot', muut_petonisäkkäät: 'Muut petonisäkkäät',
  villisika: 'Villisika', metsäkauris: 'Metsäkauris',
}

const B = {
  kana: 'bg-amber-900 text-amber-200',
  vesi: 'bg-blue-900 text-blue-200',
  kyyhky: 'bg-orange-900 text-orange-200',
  lintu: 'bg-stone-700 text-stone-200',
  jänis: 'bg-sky-900 text-sky-200',
  peto: 'bg-yellow-900 text-yellow-200',
  suur: 'bg-red-900 text-red-200',
}

const elainBadge: Record<string, string> = {
  metso: B.kana, teeri: B.kana, pyy: B.kana, riekko: B.kana,
  sinisorsa: B.vesi, tavi: B.vesi, haapana: B.vesi,
  jouhisorsa: B.vesi, heinätavi: B.vesi, lapasorsa: B.vesi,
  tukkasotka: B.vesi, telkkä: B.vesi, isokoskelo: B.vesi,
  tukkakoskelo: B.vesi, metsähanhi: B.vesi, merihanhi: B.vesi, kanadanhanhi: B.vesi,
  sepelkyyhky: B.kyyhky, uuttukyyhky: B.kyyhky, fasaani: B.kyyhky,
  lehtokurppa: B.lintu, nokikana: B.lintu, varis: B.lintu, harakka: B.lintu, naakka: B.lintu,
  metsäjänis: B.jänis, rusakko: B.jänis,
  kettu: B.peto, mäyrä: B.peto, kärppä: B.peto,
  hilleri: B.peto, näätä: B.peto, pienpedot: B.peto, muut_petonisäkkäät: B.peto,
  villisika: B.suur, metsäkauris: B.suur, euroopanmajava: B.suur,
}

export default async function SaalisPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
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

  const isAdmin = profile.role === 'admin' || profile.role === 'board_member'

  const { data: saaliset } = await supabase
    .from('saalis')
    .select('id, elain, maara, sukupuoli, ika_luokka, paikka, kuvaus, pvm, profile_id, reporter_name')
    .eq('club_id', profile.club_id)
    .order('pvm', { ascending: false })
    .limit(500)

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Saalisilmoitukset</h1>
          <NewSaalisForm clubId={profile.club_id} profileId={user.id} />
        </div>

        <SaalisFilter
          saaliset={saaliset ?? []}
          userId={user.id}
          isAdmin={isAdmin}
          elainLabels={elainLabels}
          elainBadge={elainBadge}
        />
      </div>
    </main>
  )
}
