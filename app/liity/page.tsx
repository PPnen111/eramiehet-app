import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import JoinForm from './join-form'

type InvitationRow = {
  id: string
  email: string
  club_id: string
  token: string
  status: string
  expires_at: string
}

export default async function LiityPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return <InvalidPage message="Kutsulinkkiä ei löydy. Tarkista linkki sähköpostistasi." />
  }

  const admin = createAdminClient()

  const { data: raw } = await admin
    .from('invitations')
    .select('id, email, club_id, token, status, expires_at')
    .eq('token', token)
    .single()

  if (!raw) {
    return <InvalidPage message="Kutsu ei ole voimassa tai se on jo käytetty." />
  }

  const invitation = raw as unknown as InvitationRow

  if (invitation.status !== 'pending') {
    return <InvalidPage message="Kutsu on jo käytetty tai peruutettu." />
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return <InvalidPage message="Kutsu on vanhentunut. Pyydä uusi kutsu ylläpidolta." />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Liity seuraan</h1>
          <p className="mt-2 text-sm text-[#2d6a2d]">
            Luo tili sähköpostilla{' '}
            <span className="font-medium text-[#1e3d1e]">{invitation.email}</span>
          </p>
        </div>
        <JoinForm email={invitation.email} clubId={invitation.club_id} token={invitation.token} />
      </div>
    </main>
  )
}

function InvalidPage({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-4">
      <div className="w-full max-w-sm text-center">
        <p className="mb-2 text-4xl">🦌</p>
        <h1 className="mb-3 text-xl font-bold text-[#1a1a1a]">Kutsu ei ole voimassa</h1>
        <p className="mb-6 text-sm text-[#2d6a2d]">{message}</p>
        <Link
          href="/login"
          className="text-sm font-medium text-[#2d6a2d] underline hover:text-[#1e3d1e]"
        >
          Kirjaudu sisään
        </Link>
      </div>
    </main>
  )
}
