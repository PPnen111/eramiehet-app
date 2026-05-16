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
      className="rounded-lg border border-[#e0d8cc] bg-transparent px-3 py-1.5 text-sm font-medium text-[#2d6a2d] transition-colors hover:border-[#2d6a2d] hover:text-[#1e3d1e]"
    >
      Kirjaudu ulos
    </button>
  )
}
