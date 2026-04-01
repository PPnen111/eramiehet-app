'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'welcome_seen_v1'

export default function WelcomeCard({ name }: { name: string | null }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mb-6 rounded-2xl border border-green-700 bg-green-900/20 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-green-200">
            Hei{name ? ` ${name.split(' ')[0]}` : ''}, tervetuloa! 👋
          </p>
          <p className="mt-1 text-sm text-green-400">
            Täältä löydät tapahtumat, saalisilmoitukset, eräkartano-varaukset ja paljon muuta.
            Tutustu alla oleviin ominaisuuksiin.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-green-600 hover:bg-white/10 hover:text-green-300 transition-colors"
          title="Sulje"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
