'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Etusivu',
  '/tapahtumat': 'Tapahtumat',
  '/saalis': 'Saalisilmoitukset',
  '/erakartano': 'Eräkartano',
  '/jasenet': 'Jäsenet',
  '/maksut': 'Maksut',
  '/hallinto': 'Hallinto',
  '/metsastajille': 'Metsästäjille',
  '/dokumentit': 'Metsästäjille',
  '/karttatunnukset': 'Karttatunnukset',
  '/profiili': 'Profiili',
}

export default function ActivityTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const page = PAGE_NAMES[pathname]
    if (!page) return

    fetch('/api/log-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'page_view', page }),
    }).catch(() => {})
  }, [pathname])

  return null
}
