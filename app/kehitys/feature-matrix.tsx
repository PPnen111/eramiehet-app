'use client'

const ROLES = [
  { key: 'member', label: 'Jäsen' },
  { key: 'board_member', label: 'Hallitus' },
  { key: 'admin', label: 'Admin' },
  { key: 'superadmin', label: 'Superadmin' },
]

type Access = 'full' | 'read' | 'none'

type Feature = {
  name: string
  description: string
  access: Record<string, Access>
}

const FEATURES: Feature[] = [
  {
    name: 'Dashboard',
    description: 'Etusivu ja yleiskatsaus',
    access: { member: 'full', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Jäsenet',
    description: 'Jäsenlistan selaus',
    access: { member: 'none', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Jäsenen tiedot',
    description: 'Oman profiilin muokkaus',
    access: { member: 'full', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Tapahtumat',
    description: 'Tapahtumien selaus',
    access: { member: 'read', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Tapahtuman luonti',
    description: 'Uuden tapahtuman lisäys',
    access: { member: 'none', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Tapahtuman muokkaus/poisto',
    description: 'Muokkaus ja poistaminen',
    access: { member: 'none', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Saalis',
    description: 'Saalisilmoitusten teko',
    access: { member: 'full', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Saalistilasto',
    description: 'Kaikkien saaliiden selaus',
    access: { member: 'read', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Dokumentit',
    description: 'Tiedostojen selaus',
    access: { member: 'read', board_member: 'read', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Dokumenttien hallinta',
    description: 'Lataus ja poisto',
    access: { member: 'none', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Eräkartano',
    description: 'Varausten teko',
    access: { member: 'full', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Varausten hallinta',
    description: 'Muokkaus ja poisto',
    access: { member: 'none', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Maksut',
    description: 'Omien maksujen selaus',
    access: { member: 'read', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Maksujen hallinta',
    description: 'Kaikkien maksujen hallinta',
    access: { member: 'none', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Karttakalusto',
    description: 'Karttakirjautumisten selaus',
    access: { member: 'read', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Hallinto',
    description: 'Hallintosivun pääsy',
    access: { member: 'none', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Jäsenten hallinta',
    description: 'Lisäys, muokkaus ja poisto',
    access: { member: 'none', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Kutsut',
    description: 'Jäsenten kutsuminen',
    access: { member: 'none', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Ryhmät',
    description: 'Ryhmien hallinta',
    access: { member: 'none', board_member: 'full', admin: 'full', superadmin: 'full' },
  },
  {
    name: 'Kehityssivu',
    description: '/kehitys-sivun pääsy',
    access: { member: 'none', board_member: 'none', admin: 'none', superadmin: 'full' },
  },
]

const CELL: Record<Access, { icon: string; cls: string; label: string }> = {
  full: { icon: '\u2705', cls: 'text-green-300', label: 'Täysi pääsy' },
  read: { icon: '\uD83D\uDC41', cls: 'text-yellow-300', label: 'Vain luku' },
  none: { icon: '\u274C', cls: 'text-red-400', label: 'Ei pääsyä' },
}

const ROW_BG: Record<Access, string> = {
  full: 'bg-green-900/10',
  read: 'bg-yellow-900/10',
  none: 'bg-red-900/5',
}

export default function FeatureMatrix() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-green-800 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-green-800 bg-green-950">
                <th className="sticky left-0 z-10 bg-green-950 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-400">
                  Ominaisuus
                </th>
                {ROLES.map((r) => (
                  <th
                    key={r.key}
                    className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-green-400"
                  >
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => {
                // Determine row bg based on most restrictive access
                const accesses = ROLES.map((r) => f.access[r.key])
                const hasNone = accesses.includes('none')
                const hasRead = accesses.includes('read')
                const rowType: Access = hasNone ? (hasRead ? 'read' : 'none') : accesses.includes('read') ? 'read' : 'full'

                return (
                  <tr
                    key={i}
                    className={`border-b border-green-900/30 ${ROW_BG[rowType]} hover:bg-white/[0.04] transition-colors`}
                  >
                    <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5">
                      <div>
                        <p className="font-medium text-white">{f.name}</p>
                        <p className="text-xs text-green-600">{f.description}</p>
                      </div>
                    </td>
                    {ROLES.map((r) => {
                      const access = f.access[r.key]
                      const cell = CELL[access]
                      return (
                        <td
                          key={r.key}
                          className="px-3 py-2.5 text-center"
                          title={cell.label}
                        >
                          <span className={`text-base ${cell.cls}`}>{cell.icon}</span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-green-900 bg-white/[0.03] px-4 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600">Selite</p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(CELL).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-sm">{val.icon}</span>
              <span className="text-xs text-green-300">{val.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-green-700">
          Roolit periytyvät: Superadmin &gt; Admin &gt; Hallituksen jäsen &gt; Jäsen
        </p>
        <p className="mt-1 text-xs text-green-700">
          Päivitetty: 6.4.2026
        </p>
      </div>
    </div>
  )
}
