import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isBoardOrAbove } from '@/lib/auth'
import EditCabinInfoForm from './edit-form'

type CabinInfoRow = {
  pricing_text: string | null
  instructions_text: string | null
}

export default async function MuokkaaInfoPage() {
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

  if (!profile) redirect('/login')
  if (!isBoardOrAbove(profile.role)) redirect('/erakartano')

  const { data: raw } = await supabase
    .from('cabin_info')
    .select('pricing_text, instructions_text')
    .eq('club_id', profile.club_id)
    .single()

  const info = raw ? (raw as unknown as CabinInfoRow) : null

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/erakartano" className="text-sm text-green-400 hover:text-green-300">
          ← Eräkartano
        </Link>
        <h1 className="text-2xl font-bold text-white">Muokkaa hinnastoa ja ohjeita</h1>
        <EditCabinInfoForm
          clubId={profile.club_id}
          initialPricing={info?.pricing_text ?? ''}
          initialInstructions={info?.instructions_text ?? ''}
        />
      </div>
    </main>
  )
}
