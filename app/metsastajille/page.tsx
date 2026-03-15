import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type DocRow = {
  id: string
  name: string
  category: string
  storage_path: string
  created_at: string
}

const categoryLabel: Record<string, string> = {
  seura_saannot: 'Seuran säännöt',
  hirviseurue: 'Hirviseurue',
  peurajaosto: 'Peurajaosto',
  karhujaosto: 'Karhujaosto',
  vuosikokous: 'Vuosikokous',
  kesakokous: 'Kesäkokous',
}

const categoryOrder = [
  'seura_saannot',
  'hirviseurue',
  'peurajaosto',
  'karhujaosto',
  'vuosikokous',
  'kesakokous',
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI')
}

export default async function MetsastajillePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mem } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('profile_id', user.id)
    .eq('status', 'active')
    .single()

  if (!mem) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
            ← Takaisin
          </Link>
          <p className="text-green-300">Et kuulu mihinkään seuraan.</p>
        </div>
      </main>
    )
  }

  const { data: raw } = await supabase
    .from('documents')
    .select('id, name, category, storage_path, created_at')
    .eq('club_id', mem.club_id)
    .order('created_at', { ascending: false })

  const docs = (raw ?? []) as DocRow[]

  const docsWithUrls = await Promise.all(
    docs.map(async (doc) => {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600)
      return { ...doc, url: data?.signedUrl ?? null }
    })
  )

  const grouped = docsWithUrls.reduce<Record<string, typeof docsWithUrls>>(
    (acc, doc) => {
      const cat = doc.category in categoryLabel ? doc.category : 'seura_saannot'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(doc)
      return acc
    },
    {}
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">
          ← Takaisin
        </Link>
        <h1 className="text-2xl font-bold text-white">Metsästäjille</h1>

        {docsWithUrls.length === 0 && (
          <p className="text-sm text-green-600">Ei dokumentteja.</p>
        )}

        {categoryOrder.map((cat) => {
          const items = grouped[cat]
          if (!items?.length) return null
          return (
            <section key={cat}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
                {categoryLabel[cat]}
              </h2>
              <div className="space-y-2">
                {items.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-green-800 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{doc.name}</p>
                      <p className="text-xs text-green-500">{formatDate(doc.created_at)}</p>
                    </div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-green-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                      >
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
