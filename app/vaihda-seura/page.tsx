import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClubSelector from './club-selector'
import CreateClubForm from './create-club-form'

type Club = {
  club_id: string
  club_name: string
  role: string
}

export default async function VaihdaSeuraPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { club_id: string | null; role: string | null } | null

  const clubs: Club[] = []

  if (profile?.club_id) {
    const { data: clubData } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('id', profile.club_id)
      .single()

    const club = clubData as { id: string; name: string } | null
    if (club) {
      clubs.push({
        club_id: club.id,
        club_name: club.name,
        role: profile.role ?? 'member',
      })
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-2xl font-bold text-transparent">
            Seurat
          </h1>
          <p className="mt-2 text-sm text-green-400">
            Valitse seura tai luo uusi.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {clubs.length > 0 && <ClubSelector clubs={clubs} />}
          <CreateClubForm />
        </div>
      </div>
    </main>
  )
}
