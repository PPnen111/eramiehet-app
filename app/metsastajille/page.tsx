import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Scale,
  Target,
  Rabbit,
  PawPrint,
  CalendarCheck,
  Sun,
  FileText,
  Download,
  FolderOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type DocRow = {
  id: string
  name: string
  category: string
  storage_path: string
}

const categoryLabel: Record<string, string> = {
  seura_saannot: 'Seuran säännöt',
  hirviseurue: 'Hirviseurue',
  peurajaosto: 'Peurajaosto',
  karhujaosto: 'Karhujaosto',
  vuosikokous: 'Vuosikokous',
  kesakokous: 'Kesäkokous',
  muu: 'Muut',
}

const categoryIcon: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  seura_saannot: Scale,
  hirviseurue: Target,
  peurajaosto: Rabbit,
  karhujaosto: PawPrint,
  vuosikokous: CalendarCheck,
  kesakokous: Sun,
  muu: FileText,
}

const categoryOrder = [
  'seura_saannot',
  'hirviseurue',
  'peurajaosto',
  'karhujaosto',
  'vuosikokous',
  'kesakokous',
  'muu',
]

export default async function MetsastajillePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">← Takaisin</Link>
          <p className="text-green-300">Profiilia ei löydy.</p>
        </div>
      </main>
    )
  }

  const admin = createAdminClient()

  const { data: raw } = await admin
    .from('documents')
    .select('id, name, category, storage_path')
    .eq('club_id', profile.club_id)
    .order('name', { ascending: true })

  const docs = (raw ?? []) as DocRow[]

  const docsWithUrls = await Promise.all(
    docs.map(async (doc) => {
      const { data } = await admin.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600)
      return { ...doc, url: data?.signedUrl ?? null }
    })
  )

  const grouped = docsWithUrls.reduce<Record<string, typeof docsWithUrls>>((acc, doc) => {
    const cat = doc.category in categoryLabel ? doc.category : 'muu'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(doc)
    return acc
  }, {})

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">← Takaisin</Link>
        <h1 className="text-2xl font-bold text-white">Metsästäjille</h1>

        {docsWithUrls.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-green-900 bg-white/[0.02] py-10 text-center">
            <FolderOpen size={32} className="text-green-700" strokeWidth={1.5} />
            <p className="text-sm text-green-600">Ei dokumentteja.</p>
          </div>
        )}

        {categoryOrder.map((cat) => {
          const items = grouped[cat]
          if (!items?.length) return null
          const CatIcon = categoryIcon[cat] ?? FileText
          return (
            <section key={cat}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-green-400">
                <CatIcon size={14} strokeWidth={2} />
                {categoryLabel[cat]}
              </h2>
              <div className="space-y-2">
                {items.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-green-800 bg-white/5 px-4 py-3"
                  >
                    <p className="font-medium text-white">{doc.name}</p>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-green-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                      >
                        <Download size={12} />
                        Lataa
                      </a>
                    ) : (
                      <span className="text-xs text-green-700">Ei saatavilla</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
