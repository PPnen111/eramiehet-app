import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isBoardOrAbove } from '@/lib/auth'
import CredentialCard from './credential-card'
import AddCredentialForm from './add-credential-form'

type CredentialRow = {
  id: string
  name: string
  url: string | null
  username: string | null
  password: string | null
  description: string | null
}

export default async function KarttatunnuksetPage() {
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

  const isAdmin = isBoardOrAbove(profile.role)

  const { data: raw } = await supabase
    .from('map_credentials')
    .select('id, name, url, username, password, description')
    .eq('club_id', profile.club_id)
    .order('name', { ascending: true })

  const credentials = (raw ?? []) as unknown as CredentialRow[]

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Karttatunnukset</h1>
          {isAdmin && <AddCredentialForm clubId={profile.club_id} />}
        </div>

        {credentials.length === 0 ? (
          <p className="text-sm text-green-600">Ei karttatunnuksia.</p>
        ) : (
          <div className="space-y-4">
            {credentials.map((cred) => (
              <CredentialCard key={cred.id} credential={cred} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
