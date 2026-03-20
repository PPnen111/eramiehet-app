'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-green-700 bg-transparent px-3 py-1.5 text-sm font-medium text-green-400 transition-colors hover:border-green-500 hover:text-green-300"
    >
      Kirjaudu ulos
    </button>
  )
}
