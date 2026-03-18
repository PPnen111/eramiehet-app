import { cookies } from 'next/headers'
import Link from 'next/link'
import { Eye, X } from 'lucide-react'

const roleLabel: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
}

export default async function RolePreviewBanner() {
  const cookieStore = await cookies()
  const previewRole = cookieStore.get('preview_role')?.value

  if (!previewRole || !roleLabel[previewRole]) return null

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <span className="flex items-center gap-2">
        <Eye size={15} />
        Esikatselu: <strong>{roleLabel[previewRole]}</strong>
      </span>
      <Link
        href="/superadmin/preview?exit=1"
        className="flex items-center gap-1 rounded-md bg-amber-950/20 px-2 py-0.5 text-xs hover:bg-amber-950/30 transition-colors"
      >
        <X size={12} />
        Lopeta esikatselu
      </Link>
    </div>
  )
}
